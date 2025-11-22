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

在终端 (Terminal) 中运行以下三个命令：

1.  **安装依赖包** (相当于 `pip install -r requirements.txt`)
    ```bash
    npm install
    ```

2.  **启动本地预览** (相当于启动 Jupyter Notebook)
    ```bash
    npm run dev
    ```
    *运行后，终端会显示一个网址（通常是 `http://localhost:5173`），在浏览器打开它即可看到地图。*

3.  **发布到网上**
    ```bash
    npm run deploy
    ```
    *这会自动构建网页并上传到 GitHub Pages。*

---

## 2. 核心文件结构 (File Structure)

为了方便修改，你只需要关注以下几个文件：

*   📂 **`src/constants.ts`**
    *   **用途**：存放常量。
    *   **修改场景**：你想修改地图的初始中心点、缩放级别，或者修改预览模式下的默认数据。

*   📂 **`src/services/geoService.ts`**
    *   **用途**：定义地理逻辑。
    *   **修改场景**：**最重要**。如果你想改变街区的颜色，或者重新定义哪些邮编属于哪个行政区，就在这里改 `if/else` 语句。

*   📂 **`src/components/MapBoard.tsx`**
    *   **用途**：地图组件。
    *   **修改场景**：如果你想调整地图的点击行为、弹窗样式，或者加载不同的地图底图（TileLayer）。

*   📂 **`public/`**
    *   **用途**：存放静态资源。
    *   **修改场景**：把你的 GeoJSON 文件 (`amsterdam_pc4.geojson`) 放在这里。

---

## 3. Python 数据工作流建议

作为研究者，你可能需要把自己的调查数据导入地图。

### 步骤 A: 准备地图边界 (GeoJSON)
如果你觉得目前的地图边界不够好，你可以去 [Amsterdam Open Data](https://maps.amsterdam.nl/open_geodata/) 下载新的。
*   下载格式：**GeoJSON**
*   命名为：`amsterdam_pc4.geojson`
*   放入：项目的 `public/` 文件夹中。

### 步骤 B: 批量导入初始数据
目前代码在 `App.tsx` 里有一些演示数据。如果你有几百条 Excel 数据想展示：

1.  **用 Python 转换数据**：
    ```python
    import pandas as pd

    # 1. 读取你的数据
    df = pd.read_excel("my_survey_data.xlsx")

    # 2. 确保有经纬度 (如果没有，可以用 geopy 库去跑一遍)
    # 3. 转换成 JSON 格式
    json_output = df.to_json(orient="records")
    print(json_output)
    ```

2.  **粘贴到 App.tsx**：
    找到 `App.tsx` 中的 `useEffect` 部分，把生成的 JSON 数据粘贴到 `initialData` 数组里。

---

## 4. Wix 嵌入指南 (Embed in Wix)

当你运行 `npm run deploy` 成功后，你会得到一个网址（例如 `https://yourname.github.io/repo/`）。

在 Wix 编辑器中：
1.  选择 **Embed Code (嵌入代码)** -> **Embed HTML**。
2.  输入以下代码：

```html
<iframe 
  src="https://你的GitHub用户名.github.io/你的仓库名/" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allow="geolocation" 
  style="border: none; width: 100%; height: 100vh; min-height: 600px;"
></iframe>
```

## 5. 常见问题

*   **Q: 地图显示灰色/报错？**
    *   A: 检查 `public` 文件夹里是否有 `amsterdam_pc4.geojson`。如果没有，系统会用备用数据（只有5个方块）。
    
*   **Q: 颜色太深了，遮住了路名。**
    *   A: 去 `src/components/MapBoard.tsx`，搜索 `fillOpacity` (填充透明度)，把数字改小（比如从 0.4 改成 0.1）。

*   **Q: 我想改颜色，比如把中心区改成蓝色。**
    *   A: 去 `src/services/geoService.ts`，找到 `getDistrictColorFromPC4` 函数，修改对应的 HEX 颜色代码。