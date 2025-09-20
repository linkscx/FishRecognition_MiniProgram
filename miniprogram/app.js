// app.js
App({
  onLaunch() {
    wx.cloud.init({
      //云开发环境id
      env: 'cloud1-3gx6eal502205300'  
    }),

    //调用云函数
    wx.cloud.callFunction({
      name: 'get_openId',
      success: res => {
        //获取用户openid
        this.globalData.user_openid = res.result.openid
        //在数据库中查找用户是否已经登录过了
        wx.cloud.database().collection('userInfo').where({
          _openid: res.result.openid
        }).get({
          success: result => {
            this.globalData.nickName = result.data[0].nickName,
            this.globalData.avatarUrl = result.data[0].avatarUrl,
            this.globalData.user_openid = result.data[0]._openid
          }
          
        })
        //console.log("成功调用getOpenId了")
        // console.log(res)
        // console.log(this.globalData.user_openid)
      },
      fail: err => {
        console.error("调用getOpenId失败：", err);
      }
    })
  },  
  //全局数据
  globalData: {
    //用户openid及用户信息
    user_openid: '',
    nickName:null,
    avatarUrl:null,
    //设置页面的参数
    isDefaultGender:null,//默认性别
    isAutoSave:false,//是否自动保存
    //用户登录状态
    isLogin:false
  }
})

