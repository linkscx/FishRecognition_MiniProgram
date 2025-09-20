// pages/setting/index.js
const app = getApp()
Page({
  data: {
    isAutoSave_on:false,
    isAutoSave_off:true,
    disabled_AutoSave:false,
  },

  onAutoSaveChange: function(e) {
    // 获取选中的radio的value值
    const value = e.detail.value;
    if(value === 'on'){//开启自动保存
      this.setData({
        isAutoSave_on:true,
        isAutoSave_off:false
      });
      app.globalData.isAutoSave = true
    }else if(value === 'off'){//关闭自动保存
      this.setData({
        isAutoSave_on:false,
        isAutoSave_off:true
      });
      app.globalData.isAutoSave = false
    }
    console.log(app.globalData.isAutoSave)
  },
  

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //加载页面时 就获取app中的isAutoSave和isForecast来赋给页面值
    this.setData({
      disabled_AutoSave: false,
    });
    if(app.globalData.isAutoSave){
      this.setData({
        isAutoSave_on:true,
        isAutoSave_off:false
      })
    }else{
      this.setData({
        isAutoSave_on:false,
        isAutoSave_off:true
      })
    }
    console.log(app.globalData.isAutoSave)
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