// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 使用where方法设置查询条件
      return await db.collection('fishInfo').where({
        _openid: event.openid, 
    }).get({
      success: function (res) {
        return res;
      }
    });
  } catch (e) {
    console.error(e);
  }
}