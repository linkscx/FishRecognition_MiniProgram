 
 
/**获取当前系统时间 */
function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
 
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()
 
  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
function getYMD(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();

  // 月份和日期如果小于10，前面补0
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;

  return year + '-' + month + '-' + day;
}

 
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
 
module.exports = {
  getYMD,
  formatTime 
}
 