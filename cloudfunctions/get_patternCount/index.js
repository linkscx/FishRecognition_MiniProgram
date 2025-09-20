const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 构造查询条件
    let queryConditions = {
      _openid: event.openid // 假设您的数据库中有一个字段名为_openid
    };

    // 获取满足条件的记录总数
    const countResult = await db.collection('patternInfo')
      .where(queryConditions)
      .count();
    console.log('查询成功')
    return {
      success: true,
      message: '查询成功',
      total: countResult.total // 返回记录总数
    };
  } catch (err) {
    console.error('查询失败:', err); // 输出错误信息
    return {
      success: false,
      message: '查询失败',
      error: err.toString() // 将错误对象转换为字符串
    };
  }
};