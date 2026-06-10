const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// 递归获取 Word document.xml
function readDocxText(docxPath) {
  try {
    const baseName = path.basename(docxPath, '.docx');
    const randomId = `${Date.now()}_${Math.floor(Math.random() * 10_000)}`;
    const tempZip = path.join(process.env.TEMP || '/tmp', `${randomId}.zip`);
    const tempDir = path.join(process.env.TEMP || '/tmp', `${randomId}`);

    // 复制为 zip
    fs.copyFileSync(docxPath, tempZip);

    // 解包
    fs.mkdirSync(tempDir, { recursive: true });

    // 使用 Windows tar 命令解压 zip（Windows 自带 tar 具有解压 zip 的能力）
    execSync(`tar -xf "${tempZip}" -C "${tempDir}"`);

    const docXmlPath = path.join(tempDir, 'word', 'document.xml');
    if (!fs.existsSync(docXmlPath)) {
      throw new Error('Could not find word/document.xml inside docx package');
    }

    const xmlContent = fs.readFileSync(docXmlPath, 'utf8');

    // 正则提取：按段落 <w:p> 拆分，然后拼接其中的文字 <w:t>
    const paragraphs = xmlContent.split('</w:p>');
    let outText = '';

    for (const p of paragraphs) {
      // 提取本段落里所有的 <w:t>...</w:t> 中的内容
      const tMatches = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
      if (tMatches) {
        let pText = '';
        for (const t of tMatches) {
          const content = t.replace(/<w:t[^>]*>/, '').replace('</w:t>', '');
          pText += content;
        }
        outText += `${pText}\n`;
      }
    }

    // 基础清理
    // 清理临时文件
    try {
      fs.unlinkSync(tempZip);
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    return outText.trim();
  } catch (error) {
    console.log('Error parsing docx:', error);
    return null;
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node read_docx.cjs <path_to_docx | keywords...>');
  process.exit(1);
}

const prdDir = __dirname;

// 递归寻找所有 .docx 文件
function findDocxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findDocxFiles(fullPath));
    } else if (file.endsWith('.docx')) {
      results.push(fullPath);
    }
  });
  return results;
}

let docxPath = args.join(' ');

// 如果传入的参数直接是有效文件，则直接使用
if (fs.existsSync(docxPath) && fs.statSync(docxPath).isFile()) {
  // Use direct path
} else {
  // 否则，将其作为关键词在所有 docx 文件中搜索
  const allDocx = findDocxFiles(prdDir);
  const matched = allDocx.filter((file) => {
    const relPath = path.relative(prdDir, file).toLowerCase();
    // 必须包含 args 中的所有关键词
    return args.every((arg) => relPath.includes(arg.toLowerCase()));
  });

  if (matched.length === 1) {
    docxPath = matched[0];
  } else if (matched.length > 1) {
    console.log(`\nMultiple files matched your keywords "${args.join(' ')}":`);
    matched.forEach((file, index) => {
      console.log(`[${index + 1}] ${path.relative(prdDir, file)}`);
    });
    console.log(
      '\nPlease provide more specific keywords to pinpoint the single file.',
    );
    process.exit(0);
  } else {
    console.log(
      `\nNo docx files matched your keywords "${args.join(' ')}" in ${prdDir}.`,
    );
    console.log('All available documents in this folder:');
    allDocx.forEach((file) => {
      console.log(` - ${path.relative(prdDir, file)}`);
    });
    process.exit(1);
  }
}

const targetPath = path.resolve(docxPath);
console.log(
  `Reading document: ${targetPath}\n==================================================`,
);
const text = readDocxText(targetPath);
if (text) {
  console.log(text);
} else {
  console.log('Failed to extract text from document.');
}
