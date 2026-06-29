export const IMAGE_REPO_README = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://pic.20031104.xyz/icon.svg">
  <img alt="MPic" src="https://pic.20031104.xyz/icon.svg" width="64" height="64">
</picture>

# MPic 图片存储分片

本仓库由 [MPic](https://github.com/2982136527/mpic) 图床系统自动管理，用于存储上传的图片文件及索引数据。

## 目录结构

\`\`\`
uploads/年份/月份/
  随机文件名.扩展名    上传的图片文件
data/
  *.json               索引与配置数据
\`\`\`

## 说明

- 请勿手动修改或删除本仓库中的文件，否则可能导致系统异常或数据丢失。
- 当单个仓库接近 4GB 时，系统会自动创建新的分片仓库。
- 虽然本仓库是公开的，但文件名使用随机哈希值生成，外部无法直接遍历。

`
