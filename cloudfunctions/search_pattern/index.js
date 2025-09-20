const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 构造查询条件
    let queryConditions = {
      _openid: event.openid // 确保这里使用了正确的字段名
    };

    // 如果gender不是null，则添加到查询条件中
    if (event.gender !== null) {
      queryConditions.gender = event.gender;
    }
    // 添加体长的范围条件
    if ((event.minLength !== null) && (event.maxLength !== null)) {
      queryConditions.length = db.command.and([
        db.command.gte(event.minLength),
        db.command.lte(event.maxLength)
      ]);
    }

    // 添加体重的范围条件
    if ((event.minWeight !== null) && (event.maxWeight !== null)) {
      queryConditions.weight = db.command.and([
        db.command.gte(event.minWeight),
        db.command.lte(event.maxWeight)
      ]);
    }

    // 添加日期的范围条件
    if ((event.sdateStamp !== 0) && (event.edateStamp !== 0)) {
      queryConditions.timeStamp = db.command.and([
        db.command.gte(event.sdateStamp),
        db.command.lte(event.edateStamp)
      ]);
    }

    const queryResult = await db.collection('patternInfo')
      .where(queryConditions)
      .limit(event.number)
      .get();

    if (queryResult.data.length === 0) {
      return {
        success: false,
        message: '未查询到数据',
        data: []
      };
    } else {
      return {
        success: true,
        message: '查询成功',
        data: queryResult.data
      };
    }
  } catch (err) {
    console.error('查询失败:', err); // 输出错误信息
    return {
      success: false,
      message: '查询失败',
      error: err.toString() // 将错误对象转换为字符串
    };
  }
};