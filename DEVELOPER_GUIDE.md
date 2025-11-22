# 阿姆斯特丹社区地图 - 研究者手册 (Developer Guide)

> 💡 **给 Python 背景研究者的特别说明**：
> 这个项目是一个 "React 前端应用"。
> 
> **如果你习惯用 Python：**
> 1. 把这里想象成单纯的“展示层” (Visualization Layer)。
> 2. 复杂的数据清洗 (Data Cleaning) 和 统计分析 (Statistics) 依然建议你用 Python 处理好，导出成 JSON，再放进这里展示。

---

## 1. 快速开始 (Quick Start)

你需要安装 **Node.js** (相当于 Python 的解释器)。下载地址：[nodejs.org](https://nodejs.org)。

在终端 (Terminal) 中运行以下两个命令：

1.  **安装依赖包** (相当于 `pip install -r requirements.txt`)
    ```bash
    npm install
    ```

2.  **启动本地预览** (相当于启动 Jupyter Notebook)
    ```bash
    npm run dev
    ```
    *运行后，终端会显示一个网址（通常是 `http://localhost:5173`），在浏览器打开它即可看到地图。*

---

## 2. 部署到云端 (Vercel Deployment) ☁️

这是最推荐的方式，简单且快速。

### 第一步：确保代码在 GitHub 上
你提到已经保存到 GitHub 了，这一步你应该已经完成了。

### 第二步：在 Vercel 上导入
1.  打开 [Vercel.com](https://vercel.com) 并注册账号（**建议直接用 GitHub 账号登录**，这样最方便）。
2.  在 Dashboard 页面，点击 **"Add New..."** -> **"Project"**。
3.  在左侧列表中找到你的 `amsterdam-rental-map` 仓库，点击 **"Import"**。
4.  **配置页面 (Configure Project)**：
    *   **Framework Preset**: Vercel 通常会自动识别为 `Vite`。如果没识别，手动选 `Vite`。
    *   **Root Directory**: 保持默认 (`./`)。
    *   **Build Command**: 保持默认。
    *   点击 **"Deploy"** 按钮。
5.  等待约 1 分钟，屏幕上会出现满屏的彩带 🎉。
6.  点击 **"Continue to Dashboard"**，你会看到一个 `Visit` 按钮。
    *   你的网址通常长这样：`https://amsterdam-rental-map-app.vercel.app`
    *   👉 **复制这个网址**。

---

## 3. 集成到 Wix 网页 (Wix Integration)

现在你有了 Vercel 提供的稳定网址，我们把它放进 Wix。

1.  进入 Wix 网页编辑器。
2.  点击左侧 **+ (Add Elements)**。
3.  选择 **Embed Code (嵌入代码)** -> **Embed HTML**。
4.  在弹出的设置框中：
    *   选择 **Website Address** (因为我们现在有了 Vercel 的链接，选这个比选 Code 更方便)。
    *   **Website Address**: 粘贴你在 Vercel 获得的网址 (例如 `https://amsterdam-rental-map-app.vercel.app`)。
5.  调整方框大小，建议拉大一点（宽度 100%，高度至少 600px），确保地图显示完整。

---

## 4. 核心文件结构 (File Structure)

为了方便修改，你只需要关注以下几个文件：

*   📂 **`src/data/seedData.ts`**
    *   **用途**：存放初始数据。
    *   **修改场景**：把你 Python 处理好的 JSON 数据粘贴到这里。

*   📂 **`src/services/geoService.ts`**
    *   **用途**：定义地理逻辑。
    *   **修改场景**：如果你想改变街区的颜色，或者重新定义哪些邮编属于哪个行政区，就在这里改 `if/else` 语句。

*   📂 **`src/components/MapBoard.tsx`**
    *   **用途**：地图组件。
    *   **修改场景**：调整地图样式或交互。

---

## 5. Python 数据工作流建议

作为研究者，你可能需要把自己的调查数据导入地图。

### 步骤 A: 准备地图边界 (GeoJSON)
如果你觉得目前的地图边界不够好，你可以去 [Amsterdam Open Data](https://maps.amsterdam.nl/open_geodata/) 下载新的。
*   下载格式：**GeoJSON**
*   命名为：`amsterdam_pc4.geojson`
*   放入：项目的 `public/` 文件夹中。

### 步骤 B: 批量导入初始数据
1.  **用 Python 转换数据**：
    ```python
    import pandas as pd
    # 读取 Excel -> 处理 -> 转 JSON
    # ... (参考之前的 Python 代码)
    ```
2.  **粘贴到 seedData.ts**：
    找到 `src/data/seedData.ts`，把 Python 生成的内容粘贴进去。
3.  **推送到 GitHub**：
    ```bash
    git add .
    git commit -m "Update data"
    git push
    ```
    *✨ 魔法时刻：因为你连接了 Vercel，当你执行 `git push` 后，Vercel 会自动检测到更新，并在 1-2 分钟内自动更新你的 Wix 网页！不需要手动重新部署。*
