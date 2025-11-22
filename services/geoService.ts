import { PostcodeZone } from "../types";

// ============================================================================
// 📍 GEO 服务模块 (Geo Service)
// ----------------------------------------------------------------------------
// 对于 Python 用户：
// 这个文件相当于你的 "Data Processing Script"。
// 它负责两件事：
// 1. 把邮编 (String) 转换成 经纬度 (Lat/Lng)。
// 2. 定义每个邮编属于哪个行政区，以及地图上显示什么颜色。
// ============================================================================

/**
 * 函数: 邮编转经纬度 (Geocoding)
 * 类似于 Python 的: geopy.geocoders.Nominatim
 */
export const geocodePostcode = async (postcode: string): Promise<[number, number] | null> => {
  try {
    const cleanPostcode = postcode.replace(/\s/g, '');
    
    // 调用 OpenStreetMap 的免费 API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${cleanPostcode},Amsterdam&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AmsterdamRentalMapDemo/1.0' // 礼貌地告诉服务器你是谁
        }
      }
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();
    
    if (data && data.length > 0) {
      // 注意：API 返回的是字符串，需要 parseFloat 转成数字
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
};

/**
 * 函数: 根据邮编判断行政区 (District)
 * 逻辑依据: 阿姆斯特丹官方 PC4 范围
 * 你可以根据研究需要在这里调整划分逻辑
 */
export const getDistrictNameFromPC4 = (pc4: string): string => {
  const val = parseInt(pc4); // 将字符串 "1012" 转为数字 1012 以便比较大小
  
  // Centrum (市中心)
  if (val >= 1011 && val <= 1018) return "Centrum";
  
  // Oost (东区 - 包括 Zeeburg, IJburg)
  if (val === 1019) return "Oost (Oostelijk Havengebied)";
  if (val >= 1086 && val <= 1099) return "Oost";
  
  // Noord (北区)
  if (val >= 1020 && val <= 1039) return "Noord";
  
  // Westpoort (西港工业区)
  if (val >= 1040 && val <= 1049) return "Westpoort";
  
  // West (西区)
  if (val >= 1050 && val <= 1059) return "West";
  
  // Nieuw-West (新西区)
  if (val >= 1060 && val <= 1069) return "Nieuw-West";
  
  // Zuid (南区 - 博物馆区/Zuidas)
  if (val >= 1070 && val <= 1083) return "Zuid";
  
  // Zuidoost (东南区 - Bijlmer)
  if (val >= 1100 && val <= 1109) return "Zuidoost";
  
  return "Metropolitan Area"; // 兜底选项
};

/**
 * 函数: 定义颜色映射
 * 类似于 Python matplotlib 的 colormap
 * 你可以在这里修改 HEX 颜色代码
 */
export const getDistrictColorFromPC4 = (pc4: string): string => {
  const val = parseInt(pc4);
  
  // Centrum: Red (红色)
  if (val >= 1011 && val <= 1018) return '#E4002B'; 
  
  // Oost: Orange (橙色)
  if (val === 1019 || (val >= 1086 && val <= 1099)) return '#FF7F00'; 
  
  // Noord: Purple (紫色)
  if (val >= 1020 && val <= 1039) return '#8F00FF'; 
  
  // Westpoort: Grey (灰色 - 工业区)
  if (val >= 1040 && val <= 1049) return '#787878'; 
  
  // West: Blue (蓝色)
  if (val >= 1050 && val <= 1059) return '#009DE6'; 
  
  // Nieuw-West: Olive Green (橄榄绿)
  if (val >= 1060 && val <= 1069) return '#6D8B24'; 
  
  // Zuid: Dark Green (深绿)
  if (val >= 1070 && val <= 1083) return '#007E3C'; 
  
  // Zuidoost: Magenta/Pink (粉红)
  if (val >= 1100 && val <= 1109) return '#EC008C'; 
  
  return '#A0A0A0'; // 默认灰色
};

// 辅助函数：生成一个基础的 Zone 对象
export const getZoneFromPostcode = (postcode: string): PostcodeZone | undefined => {
  const pc4 = postcode.trim().substring(0, 4);
  return {
    id: pc4,
    districtName: getDistrictNameFromPC4(pc4),
    color: getDistrictColorFromPC4(pc4),
    center: [52.3702, 4.8952], // 默认中心点
    polygon: [] // 多边形数据会在地图组件中加载
  };
};