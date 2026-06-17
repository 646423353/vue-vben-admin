/**
 * 全局图片旋转方向管理器
 *
 * 功能说明：
 * 1. 监听 Element Plus 图片预览弹层（.el-image-viewer__img）的 transform 样式变化
 * 2. 【核心】采用“基准叠加算法”：Element Plus 内部对角度的记录总是从 0 起步，
 *    我们在它的增量基础上叠加持久化的历史角度，避免组件内部状态将真实状态跳闪覆盖。
 * 3. 角度发生实质变化时，自动异步上传到后端并存入 LocalStorage。
 * 4. 完全无侵入式拦截，不需要匹配 DOM 的具体旋转按钮，不绑定点击事件。
 */

import { rotateCaseFileApi } from '#/api/core/case-record';

const STORAGE_PREFIX = 'img_rotation_';
const VIEWER_WRAPPER_CLASS = 'el-image-viewer__wrapper';
const VIEWER_IMG_CLASS = 'el-image-viewer__img';

// ─────────────────────────────────────────────
// localStorage 存取与 URL 规范化
// ─────────────────────────────────────────────

/**
 * 规范化 URL 路径，去掉协议、域名和请求参数
 * 用于解决不同环境下图片相对路径、防缓存时间戳所造成的指纹匹配失败
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname;
  } catch {
    return url;
  }
}

export function getStoredRotation(url: string): number {
  if (!url) return 0;
  try {
    const key = STORAGE_PREFIX + encodeURIComponent(normalizeUrl(url));
    const raw = localStorage.getItem(key);
    return raw ? Number.parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setStoredRotation(url: string, degree: number): void {
  if (!url) return;
  try {
    const key = STORAGE_PREFIX + encodeURIComponent(normalizeUrl(url));
    if (degree === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(degree));
    }
  } catch {}
}

const urlToIdMap = new Map<string, number | string>();

export function registerImageUrls(
  files: { id?: number | string; rotateAngle?: number; url?: string }[],
): void {
  if (!files) return;
  files.forEach((f) => {
    if (f.url && f.id !== undefined) {
      const norm = normalizeUrl(f.url);
      urlToIdMap.set(norm, f.id);
      if (typeof f.rotateAngle === 'number') {
        setStoredRotation(norm, f.rotateAngle);
      }
    }
  });
}

async function uploadRotationToServer(
  url: string,
  degree: number,
): Promise<void> {
  const norm = normalizeUrl(url);
  const fileId = urlToIdMap.get(norm);
  if (fileId !== undefined) {
    try {
      await rotateCaseFileApi({ fileId, rotateAngle: degree });
    } catch (error) {
      console.error('[ImageRotation] Failed to save image rotation to server:', error);
    }
  }
}

// ─────────────────────────────────────────────
// transform 解析工具
// ─────────────────────────────────────────────

function parseRotateFromTransform(transform: string): number {
  if (!transform) return 0;
  const degMatch = transform.match(/rotate\(\s*(-?[\d.]+)\s*deg\s*\)/);
  if (degMatch && degMatch[1] !== undefined) {
    return Math.round(Number.parseFloat(degMatch[1]));
  }
  const radMatch = transform.match(/rotate\(\s*(-?[\d.]+)\s*rad\s*\)/);
  if (radMatch && radMatch[1] !== undefined) {
    return Math.round((Number.parseFloat(radMatch[1]) * 180) / Math.PI);
  }
  return 0;
}

function normalizeDegree(degree: number): number {
  return ((degree % 360) + 360) % 360;
}

// ─────────────────────────────────────────────
// 预览弹层核心拦截逻辑：样式劫持与叠加补偿算法
// ─────────────────────────────────────────────

let currentPreviewUrl = '';
let imgMutationObserver: MutationObserver | null = null;
let bodyMutationObserver: MutationObserver | null = null;

// 记录当前图片从缓存中读取出来的“历史基础角度”
let currentBaseDegree = 0;
// 记录当前实际对 DOM 生效的“总展示角度”，用于对比如有变化则上报
let lastAppliedDegree = 0;
// 锁，防止死循环
let isSelfApplying = false;

function getViewerImg(): HTMLImageElement | null {
  const wrapper = document.querySelector(`.${VIEWER_WRAPPER_CLASS}`);
  if (!wrapper) return null;
  return wrapper.querySelector(`.${VIEWER_IMG_CLASS}`) as HTMLImageElement | null;
}

/**
 * 当预览图片首次加载或切换（src 变化）时
 */
function onImgSwitch(img: HTMLImageElement): void {
  const url = img.src || img.getAttribute('src') || '';
  if (!url || url === currentPreviewUrl) return;

  currentPreviewUrl = url;
  const norm = normalizeUrl(url);

  // 1. 获取该图片的历史基准角度，更新全局基准上下文
  currentBaseDegree = getStoredRotation(norm);
  // 2. 初始化记录器，待首次 mutation 后它将被合并赋予实际角度
  lastAppliedDegree = currentBaseDegree;

  // 3. 直接且强硬地为新图片赋予历史角度，避免由于未被 Mutation 捕获导致的初次展示失败
  requestAnimationFrame(() => {
    const latestImg = getViewerImg();
    if (latestImg) {
      isSelfApplying = true;
      latestImg.style.transform = `scale(1) rotate(${currentBaseDegree}deg)`;
      Promise.resolve().then(() => {
        isSelfApplying = false;
      });
    }
  });
}

function observeViewerImg(): void {
  if (imgMutationObserver) {
    imgMutationObserver.disconnect();
    imgMutationObserver = null;
  }

  const img = getViewerImg();
  if (!img) return;

  onImgSwitch(img);

  imgMutationObserver = new MutationObserver((mutations) => {
    if (isSelfApplying) return;

    const currentImg = getViewerImg();
    if (!currentImg) return;

    const newUrl = currentImg.src || currentImg.getAttribute('src') || '';
    if (newUrl && newUrl !== currentPreviewUrl) {
      onImgSwitch(currentImg);
      return;
    }

    // --- 核心补偿逻辑 ---
    // 此时拿到的是 Element Plus 组件刚刚赋上去的原生 transform
    // 例如：scale(1) rotate(90deg)
    const transform = currentImg.style.transform || '';
    
    // 提取 Element Plus 内部维护的相对增量角度（它总是从 0 开始计算，一点击就变成 90）
    const viewerDegree = parseRotateFromTransform(transform);
    
    // 真实应展示的绝对总角度 = 历史基础角度 + 本次组件的内部增量
    // 【关键修复】给 DOM 赋值的 CSS 角度绝不能取模，必须允许 360, 450, -90 等数值，否则会导致动画反向退回！
    const actualCssDegree = currentBaseDegree + viewerDegree;

    // 剔除原来的 rotate 函数，换上我们计算出的连续总角度
    const withoutRotate = transform.replaceAll(/rotate\([^)]*\)/g, '').trim();
    const newTransform = withoutRotate ? `${withoutRotate} rotate(${actualCssDegree}deg)` : `rotate(${actualCssDegree}deg)`;

    // 开启防重入标记，写入真实 DOM
    isSelfApplying = true;
    currentImg.style.transform = newTransform;
    // 巧妙利用 Promise 微任务，在 DOM 更新后立即释放锁
    Promise.resolve().then(() => {
      isSelfApplying = false;
    });

    // 检查角度是否发生了实质性改变
    if (actualCssDegree !== lastAppliedDegree) {
      // 在保存和上报后端时，必须规范化到 0~359
      const normalizedDegree = normalizeDegree(actualCssDegree);
      
      const norm = normalizeUrl(newUrl);
      setStoredRotation(norm, normalizedDegree);
      uploadRotationToServer(norm, normalizedDegree);
      
      lastAppliedDegree = actualCssDegree;
    }
  });

  imgMutationObserver.observe(img, {
    attributes: true,
    attributeFilter: ['src', 'style'],
  });
}

function cleanupViewer(): void {
  if (imgMutationObserver) {
    imgMutationObserver.disconnect();
    imgMutationObserver = null;
  }
  currentPreviewUrl = '';
}

// ─────────────────────────────────────────────
// 弹层状态监听与全局挂载
// ─────────────────────────────────────────────

function watchViewerAppearance(): void {
  bodyMutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains(VIEWER_WRAPPER_CLASS) ||
            node.querySelector?.(`.${VIEWER_WRAPPER_CLASS}`))
        ) {
          requestAnimationFrame(() => observeViewerImg());
        }
      }
      for (const node of mutation.removedNodes) {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains(VIEWER_WRAPPER_CLASS) ||
            node.querySelector?.(`.${VIEWER_WRAPPER_CLASS}`))
        ) {
          cleanupViewer();
        }
      }
    }
  });

  bodyMutationObserver.observe(document.body, { childList: true, subtree: true });
}

let initialized = false;

export function initGlobalImageRotation(): void {
  if (initialized) return;
  initialized = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchViewerAppearance);
  } else {
    watchViewerAppearance();
  }
}

export function destroyGlobalImageRotation(): void {
  if (bodyMutationObserver) {
    bodyMutationObserver.disconnect();
    bodyMutationObserver = null;
  }
  cleanupViewer();
  initialized = false;
}
