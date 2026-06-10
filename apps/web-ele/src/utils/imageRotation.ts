/**
 * 全局图片旋转方向管理器
 *
 * 功能说明：
 * 1. 监听 Element Plus 图片预览弹层（.el-image-viewer__img）的 transform 样式变化
 * 2. 当用户手动旋转图片后，将旋转角度以图片 URL 为 key 存入 localStorage
 * 3. 预览弹层切换图片时，自动从 localStorage 恢复该图片的旋转角度
 * 4. 预留后端对接接口（uploadRotationToServer / fetchRotationFromServer）
 *    供后续版本在保存时同步旋转信息到服务器，实现跨设备持久化
 *
 * 设计原则：
 * - 完全无侵入：不修改 Element Plus 源码，不修改组件内部逻辑
 * - 通过全局 MutationObserver + 事件代理实现，挂载一次即可全局生效
 */

/** localStorage 存储的 key 前缀 */
// ─────────────────────────────────────────────
// 后端对接接口
// ─────────────────────────────────────────────

import { rotateCaseFileApi } from '#/api/core/case-record';

const STORAGE_PREFIX = 'img_rotation_';

/** 预览弹层的根容器 class，用于判断弹层是否存在 */
const VIEWER_WRAPPER_CLASS = 'el-image-viewer__wrapper';

/** 弹层内图片元素的 class */
const VIEWER_IMG_CLASS = 'el-image-viewer__img';

/** 旋转按钮的 class（用于主动监听点击事件） */
const ROTATE_BTN_SELECTORS = [
  '[aria-label="Rotate Clockwise"]',
  '[aria-label="Rotate AntiClockwise"]',
  // Element Plus 不同版本可能用 title 或 aria-label
  'button[title*="旋转"]',
  'button[title*="Rotate"]',
  '.el-image-viewer__actions button:nth-child(5)',
  '.el-image-viewer__actions button:nth-child(6)',
];

// ─────────────────────────────────────────────
// localStorage 存取工具
// ─────────────────────────────────────────────

/**
 * 规范化 URL 路径，去掉协议、域名和请求参数
 * 用于解决不同环境下（相对路径 vs 绝对路径，带 t=xxx 时间戳防缓存）的图片匹配问题
 */
function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname; // 仅保留 /path/to/img.jpg
  } catch {
    return url;
  }
}

/**
 * 从 localStorage 读取指定图片 URL 的旋转角度
 * @param url 图片的完整 URL
 * @returns 旋转角度（整数度数），默认 0
 */
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

/**
 * 将旋转角度写入 localStorage
 * @param url 图片的完整 URL
 * @param degree 旋转角度（整数度数）
 */
export function setStoredRotation(url: string, degree: number): void {
  if (!url) return;
  try {
    const key = STORAGE_PREFIX + encodeURIComponent(normalizeUrl(url));
    if (degree === 0) {
      // 0 度时清理存储，避免无意义数据堆积
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, String(degree));
    }
  } catch {
    // 存储满时静默忽略
  }
}

/** 全局图片 URL 到 ID 映射 */
const urlToIdMap = new Map<string, number | string>();

/**
 * 注册图片 URL 与文件 ID 的映射关系
 * 若文件自带旋转角度，将其同步到本地存储以供直接渲染
 * @param files 图片文件记录列表
 */
export function registerImageUrls(
  files: { id?: number | string; rotateAngle?: number; url?: string }[],
): void {
  if (!files) return;
  files.forEach((f) => {
    if (f.url && f.id !== undefined) {
      const norm = normalizeUrl(f.url);
      urlToIdMap.set(norm, f.id);
      // 如果后端返回了有效的旋转角度，将其同步存入 localStorage
      if (typeof f.rotateAngle === 'number') {
        setStoredRotation(norm, f.rotateAngle);
      }
    }
  });
}

/**
 * 将旋转角度上报到后端接口
 * @param url 图片 URL
 * @param degree 旋转角度
 */
async function uploadRotationToServer(
  url: string,
  degree: number,
): Promise<void> {
  const norm = normalizeUrl(url);
  const fileId = urlToIdMap.get(norm);
  if (fileId !== undefined) {
    try {
      await rotateCaseFileApi({ fileId, rotateAngle: degree });
      // eslint-disable-next-line no-console
      console.log(
        `Image rotate upload success: fileId=${fileId}, angle=${degree}`,
      );
    } catch (error) {
      console.error('Failed to save image rotation to server:', error);
    }
  }
}

// ─────────────────────────────────────────────
// transform 解析工具
// ─────────────────────────────────────────────

/**
 * 从 CSS transform 字符串中提取旋转角度
 * 例："rotate(90deg) scale(1)" → 90
 * @param transform transform 字符串
 * @returns 旋转角度，提取失败时返回 0
 */
function parseRotateFromTransform(transform: string): number {
  if (!transform) return 0;
  // 匹配 rotate(Xdeg) 或 rotate(Xrad)，容忍空格
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

/**
 * 将旋转角度规范化到 [0, 360) 区间
 * @param degree 任意角度值
 */
function normalizeDegree(degree: number): number {
  return ((degree % 360) + 360) % 360;
}

// ─────────────────────────────────────────────
// 预览弹层核心逻辑
// ─────────────────────────────────────────────

/** 当前正在预览的图片 URL */
let currentPreviewUrl = '';

/** MutationObserver 实例（监听 transform 变化） */
let imgMutationObserver: MutationObserver | null = null;

/** MutationObserver 实例（监听弹层 DOM 出现/消失） */
let bodyMutationObserver: MutationObserver | null = null;

/**
 * 获取当前预览弹层中的图片元素
 */
function getViewerImg(): HTMLImageElement | null {
  const wrapper = document.querySelector(`.${VIEWER_WRAPPER_CLASS}`);
  if (!wrapper) return null;
  return wrapper.querySelector(
    `.${VIEWER_IMG_CLASS}`,
  ) as HTMLImageElement | null;
}

/**
 * 读取当前预览图片的 src（即图片 URL）
 */
function getCurrentImgUrl(): string {
  const img = getViewerImg();
  return img?.src || img?.getAttribute('src') || '';
}

/**
 * 对预览图片应用指定角度的旋转（在原有 transform 基础上替换 rotate 部分）
 * @param img 图片 DOM 元素
 * @param degree 目标旋转角度
 */
function applyRotationToImg(img: HTMLImageElement, degree: number): void {
  const current = img.style.transform || '';
  // 移除已有的 rotate() 并追加新的旋转值
  const withoutRotate = current.replaceAll(/rotate\([^)]*\)/g, '').trim();
  if (degree === 0) {
    img.style.transform = withoutRotate || '';
  } else {
    img.style.transform = withoutRotate
      ? `${withoutRotate} rotate(${degree}deg)`
      : `rotate(${degree}deg)`;
  }
}

/**
 * 当预览图片切换（src 变化）时，自动恢复该图片的历史旋转角度
 * @param img 图片 DOM 元素
 */
function onImgSwitch(img: HTMLImageElement): void {
  const url = img.src || img.getAttribute('src') || '';
  if (!url || url === currentPreviewUrl) return;

  currentPreviewUrl = url;

  // 从本地存储读取历史旋转角度
  const storedDegree = getStoredRotation(url);

  if (storedDegree !== 0) {
    // 等待 Element Plus 完成自身初始化渲染后再应用旋转，避免被覆盖
    requestAnimationFrame(() => {
      const latestImg = getViewerImg();
      if (latestImg) {
        applyRotationToImg(latestImg, storedDegree);
      }
    });
  }
}

/**
 * 当用户点击旋转按钮后，读取最新的 transform 并存储到 localStorage
 */
function onRotateBtnClick(): void {
  // 需要稍微延迟，等 Element Plus 内部完成旋转动画赋值
  setTimeout(() => {
    const img = getViewerImg();
    if (!img) return;

    const transform = img.style.transform || '';
    const degree = normalizeDegree(parseRotateFromTransform(transform));

    const url = getCurrentImgUrl();
    if (url) {
      setStoredRotation(url, degree);
      uploadRotationToServer(url, degree);
    }
  }, 50);
}

/**
 * 对预览弹层内的图片元素挂载 MutationObserver
 * 监听 style 属性变化（transform），捕捉图片切换事件
 */
function observeViewerImg(): void {
  // 清理旧的 Observer
  if (imgMutationObserver) {
    imgMutationObserver.disconnect();
    imgMutationObserver = null;
  }

  const img = getViewerImg();
  if (!img) return;

  // 记录初始 URL 并恢复历史旋转
  onImgSwitch(img);

  imgMutationObserver = new MutationObserver(() => {
    const currentImg = getViewerImg();
    if (!currentImg) return;

    const newUrl = currentImg.src || currentImg.getAttribute('src') || '';
    if (newUrl && newUrl !== currentPreviewUrl) {
      // 图片 URL 发生变化，说明切换了图片
      onImgSwitch(currentImg);
    }
  });

  imgMutationObserver.observe(img, {
    attributes: true,
    attributeFilter: ['src', 'style'],
  });
}

/**
 * 清理预览弹层相关的 Observer 和状态
 */
function cleanupViewer(): void {
  if (imgMutationObserver) {
    imgMutationObserver.disconnect();
    imgMutationObserver = null;
  }
  currentPreviewUrl = '';
}

// ─────────────────────────────────────────────
// 全局事件代理：旋转按钮点击
// ─────────────────────────────────────────────

/**
 * 全局事件代理处理器，捕捉预览弹层内的旋转按钮点击
 */
function globalClickHandler(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (!target) return;

  // 判断是否在预览弹层内
  const wrapper = target.closest(`.${VIEWER_WRAPPER_CLASS}`);
  if (!wrapper) return;

  // 判断是否点击了旋转相关的按钮
  const isRotateBtn = ROTATE_BTN_SELECTORS.some((selector) => {
    try {
      return target.closest(selector) !== null;
    } catch {
      return false;
    }
  });

  if (isRotateBtn) {
    onRotateBtnClick();
  }
}

// ─────────────────────────────────────────────
// 全局 MutationObserver：监听弹层出现/消失
// ─────────────────────────────────────────────

/**
 * 监听 document.body 的子树变化
 * 当 .el-image-viewer__wrapper 出现时，自动挂载图片 Observer
 * 当弹层消失时，清理 Observer
 */
function watchViewerAppearance(): void {
  bodyMutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // 检查是否有新增节点包含预览弹层
      for (const node of mutation.addedNodes) {
        if (
          node instanceof HTMLElement &&
          (node.classList.contains(VIEWER_WRAPPER_CLASS) ||
            node.querySelector?.(`.${VIEWER_WRAPPER_CLASS}`))
        ) {
          // 弹层出现，延迟一帧等待图片加载完成
          requestAnimationFrame(() => {
            observeViewerImg();
          });
        }
      }

      // 检查是否有移除节点包含预览弹层（弹层关闭）
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

  bodyMutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ─────────────────────────────────────────────
// 公开初始化入口
// ─────────────────────────────────────────────

/** 标记是否已初始化，防止重复挂载 */
let initialized = false;

/**
 * 初始化全局图片旋转管理器
 * 应在 bootstrap.ts 中调用一次，整个应用生命周期内全局生效
 */
export function initGlobalImageRotation(): void {
  if (initialized) return;
  initialized = true;

  // 等待 DOM 准备完毕后再开始监听
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      watchViewerAppearance();
      document.addEventListener('click', globalClickHandler, true);
    });
  } else {
    watchViewerAppearance();
    document.addEventListener('click', globalClickHandler, true);
  }
}

/**
 * 销毁全局图片旋转管理器（通常不需要主动调用）
 */
export function destroyGlobalImageRotation(): void {
  if (bodyMutationObserver) {
    bodyMutationObserver.disconnect();
    bodyMutationObserver = null;
  }
  cleanupViewer();
  document.removeEventListener('click', globalClickHandler, true);
  initialized = false;
}
