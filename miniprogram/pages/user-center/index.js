// pages/login/index.js
const app = getApp()
Page({
  getAvatar(e){
    //console.log(e)
    this.setData({
      avatarUrl:e.detail.avatarUrl
    })
    app.globalData.avatarUrl = e.detail.avatarUrl
  },
  getName(e){
    //console.log(e)
    this.setData({
      nickName:e.detail.value
    })
    app.globalData.nickName = e.detail.value
  },
  //退出
  logout(){
    app.globalData.avatarUrl=null
    app.globalData.nickName=null
    app.globalData.isLogin=false
    this.setData({
      nickName:null,
      avatarUrl:null,
      isLogin:true
    })
  },
  //设置
  setting:function(event){
    // 跳转到指定页面（路径为 '/pages/somepage/somepage'）
    wx.navigateTo({
      url: '/pages/setting/index'
    });
  },
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl:'',
    nickName:'',
    isHidden:true,
    isLogin:true
  },
  
  /**弹出取消 */
  popNo(){
    this.setData({
      isHidden:true
    })
  },
  //弹出 昵称和头像框 
  goLogin(){
    //检查之前是否已经授权登录
    wx.cloud.database().collection('userInfo').where({
      _openid: app.globalData.user_openid
    }).get({
      success: res => {
        //原先没有添加，这里添加
        //弹出昵称和图像框  
        if (!res.data[0]) {
          this.setData({
            isHidden:false
          })
        } else {
          //已经添加过了  将数据库的avatarUrl和nickName赋值给页面
          this.setData({
            avatarUrl: res.data[0].avatarUrl,
            nickName: res.data[0].nickName,
            isLogin:false //不显示 一键登录按钮
          })
          // 系统初始化 只会执行一次app.js 也就是只会执行一次 一键登录
          //当第一次一键登录后 再退出 此时app的globalData的值会被重置为null
          // 也就是 再登陆时 需要找到数据库的值 重新赋值给globalData
          app.globalData.isLogin = true//设置为登陆状态
          app.globalData.nickName = res.data[0].nickName
          app.globalData.avatarUrl = res.data[0].avatarUrl
        }
      }
    })
    
  },
  popYes(){
    let avatarUrl = this.data.avatarUrl
    let nickName = this.data.nickName
    if(!avatarUrl){
      wx.showToast({
        icon:'error',
        title: '请获取头像',
      })
      return 
    }
    if(!nickName){
      wx.showToast({
        icon:'error',
        title: '请获取昵称',
      })
      return 
    }
    this.setData({
      isHidden:true,
      isLogin:false
    })
    app.globalData.isLogin = true//设置为登陆状态

    this.uploadAvatar(avatarUrl);

    // 调用方法开始等待流程
    this.getAvatarUrl().then(path => {
      avatarUrl = path;
      console.log('最终的头像链接:', avatarUrl)
      //弹出了  就说明数据库没有用户的信息 将数据添加到数据库
      wx.cloud.database().collection('userInfo').add({
        data: {
          avatarUrl: avatarUrl,
          nickName: nickName
        },
        success: res => {
          wx.showToast({
            title: '登录成功',
            icon: 'none'
          })
        }
      })
    });

  },
  // 异步函数：等待this.data._avatar_path有值后返回
  async waitForAvatarUrl() {
    // 返回一个Promise，等待_avatar_path不为空
    return new Promise((resolve) => {
      // 定义检查函数
      const checkAvatarPath = () => {
        if (this.data._avatar_path) {
          // 当有值时，解析Promise返回结果
          resolve(this.data._avatar_path);
        } else {
          // 无值时，100毫秒后再次检查
          setTimeout(checkAvatarPath, 100);
        }
      };
      
      // 立即开始第一次检查
      checkAvatarPath();
    });
  },
  //等待获取
  async getAvatarUrl() {
    // 等待异步函数返回结果，赋值给avatarUrl
    const avatarUrl = await this.waitForAvatarUrl();
    // 此时avatarUrl已确保有值，可以进行后续操作
    console.log("获取到的头像路径：", avatarUrl);
    return avatarUrl;
  },
  uploadAvatar(path){//上传头像
    let _this = this
    wx.cloud.uploadFile({//上传至微信云存储
      cloudPath: app.globalData.nickName + '/' + "avatar.jpg",
      filePath:path,// 本地文件路径
      success: res => {
        _this.setData({
          ['avatarFileId']: res.fileID, // 将每张图片的 fileID 保存到 data 中
        });
        avatarUrl = _this.getAvatarFileURL(res.fileID);
      },
      fail: err =>{
        console.error(`头像上传失败`, err);
        wx.showToast({
          icon:'none',
          title: '头像上传失败，请重试',
          duration:2000
        })
      }
    });
  },
  //获取上传到云存储的头像下载链接
  getAvatarFileURL(fileID) {
    let that = this;
    wx.cloud.getTempFileURL({
      fileList: [fileID], // 文件ID数组
      success: res => {
        if (res.fileList.length > 0) {
          // 获取第一个文件的临时下载链接
          const fileURL = res.fileList[0].tempFileURL;
          // 这里可以将文件下载链接返回给服务器
          that.setData({
            ['_avatar_path']: fileURL // 更新data中的图片下载地址
          });
          // console.log('头像下载地址', that.data._avatar_path);
        }
      },
      fail: err =>{
        console.error(`头像链接获取失败`, err);
        wx.showToast({
          icon:'none',
          title: '头像链接获取失败，请重试',
          duration:2000
        })
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    //console.log(app.globalData.user_openid)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})