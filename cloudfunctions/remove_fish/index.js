
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

exports.main = async (event, context) => {
  // 检查 event 是否有效
  const { _id } = event;

  // 确保 _id 是数组
  if (!Array.isArray(_id)) {
    return {
      success: false,
      message: '_id 必须是数组'
    };
  }

  try {
    // 批量删除文档
    const results = await Promise.all(_id.map(async (id) => {
      return cloud.database().collection('fishInfo').doc(id).remove();
    }));

    // 所有文档删除成功
    return {
      success: true,
      message: '记录删除成功',
      data: results
    };
  } catch (err) {
    // 删除过程中出现错误
    return {
      success: false,
      message: '记录删除失败',
      error: err
    };
  }
};