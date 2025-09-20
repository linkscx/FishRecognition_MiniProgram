// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 云函数 index.js
const XLSX = require('node-xlsx');

exports.main = async (event, context) => {
  try {
    const { items } = event; // 从event中获取前端传递的数据数组

    // 创建Excel文件的数据
    const data = [
      ['第一张图片下载链接','第二张图片下载链接','第三张图片下载链接','处理时间','体长', '体重', '性别', '头胸甲长', '头胸甲宽', '头胸甲高','螯足长', '螯足宽','腹节长','腹节宽','腹节高','抱卵量'], // 表头
      ...items.map(item => [
        item._image_path0,
        item._image_path1,
        item._image_path2,
        item._image_name,
        item.length,
        item.weight,
        item.gender, 
        item.cuirassLength,
        item.cuirassWidth,
        item.cuirassHeight,
        item.cheliceraeLength,
        item.cheliceraeWidth,
        item.bellyLength,
        item.bellyWidth,
        item.bellyHeight,
        item.eggs
      ])
    ];

    // 使用node-xlsx创建Excel文件的Buffer
    const buffer = XLSX.build([{ name: '数据', data: data }]);

    // 返回Buffer
    return {
      success: true,
      data: buffer,
    };
  } catch (error) {
    // 处理错误
    return {
      success: false,
      message: error.message,
    };
  }
};