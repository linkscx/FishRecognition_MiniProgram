// pages/search/index.js
const app = getApp();
var util = require('../../utils/utils.js');

Page({
  
  /**
   * 页面的初始数据
   */
  data: {
    totalHeight:0,
    number:NaN,
    haveNumber:false,//标记输入框内是否  有用户输入的值
    date: null,//文件的存储日期 
    filePath:null,//文件的临时路径
    countResult:null,//数据库记录总条数
    fileId:[],//查询出来的文件id
    _id:[],//查询出来的数据库记录id
    sdate:'',//起始时间表示
    sdateStamp:0,//起始时间的时间戳
    edate:'',//终止时间表示
    edateStamp:0,//终止时间的时间戳
    shape:null,
    headList: [
      { title: '存储日期' },
      { title: '预测体型' },
      { title: '置信度' },
      { title: '图片' },
    ],
    patternList:[],
  },
  bindSDateChange: function (e) {
    var sdate = e.detail.value + "T00:00:00"
    sdate = Math.round(new Date(sdate).getTime() / 1000)
    this.setData({
      sdate: e.detail.value,
      sdateStamp:sdate
    })
  },
  bindEDateChange: function (e) {
    var edate = e.detail.value + "T23:59:59"
    edate = Math.round(new Date(edate).getTime() / 1000)
    this.setData({
      edate: e.detail.value,
      edateStamp:edate
    })
  },
  bindSDateCancel: function() {
    this.setData({
      sdate: '', // 或者您可以设置为其它默认值
      sdateStamp:0
    });
  },
  bindEDateCancel: function() {
    this.setData({
      edate: '', // 或者您可以设置为其它默认值
      edateStamp:0
    });
  },
  numberInput: function(e) {
    const number = parseInt(e.detail.value, 10);//从string转为int
    if(!isNaN(number)){
      this.setData({
        haveNumber:true,
        number: number // 更新data中的inputVal为输入框的当前值
      });
    }else{
      this.setData({
        haveNumber:false,
        number: NaN
      });
    }
    // console.log(this.data.haveNumber)
  },

  //查询按钮绑定的函数
  search:function(){
    this.verifyData();
  },
  //调用count_result云函数 查询记录条数 并赋值给页面
  getPatternCount:function(){
    const _this = this;
    wx.cloud.callFunction({
      name: 'get_patternCount', // 云函数名称
      data: {
        openid: app.globalData.user_openid, 
      },
      success: function(res) {
        if (res.result.success) {
          _this.setData({
            countResult: res.result.total // 将返回的记录总数赋值给页面数据
          });
          //如果number是上一次的值 但是输入框什么也没有 就重新赋值
          if(isNaN(_this.data.number) || !_this.data.haveNumber){
            _this.setData({
              number:_this.data.countResult
            })
          }
        } else {
          wx.showToast({
            title: '获取总记录数失败，请刷新页面',
            icon: 'none',
            duration:2000
          });
        }
      },
      fail: function(err) {
        console.error('云函数调用失败', err);
        wx.showToast({
          title: '调用失败',
          icon: 'none'
        });
      }
    });
  },
  //校验查询数据是否合法
  verifyData:function(){
    // 定义一个数组来存储所有的错误信息
    const errorMessages = [];
    if(this.data.number > this.data.countResult){
      errorMessages.push('查询个数已超出总记录数');
    }
    //如果number输入框 什么都没有 就默认查询所有记录
    if(isNaN(this.data.number)){
      this.setData({
        number:this.data.countResult
      })
    }
    // 检查每个值是否在1到10的范围内，并收集错误信息
    if((this.data.sdateStamp===0) && (this.data.edateStamp !== 0)){
      errorMessages.push('请输入开始日期');
    }else if((this.data.sdateStamp!==0) && (this.data.edateStamp === 0)){
      errorMessages.push('请输入终止日期');
    }else if((this.data.sdateStamp!==0) && (this.data.edateStamp !== 0)){
      if(this.data.sdateStamp > this.data.edateStamp){
        errorMessages.push('日期不合法，请重新选择');
      }
    }
    // 如果有错误信息，循环显示所有的错误信息
    // 如果有错误信息，显示模态对话框
    if (errorMessages.length > 0) {
      wx.showModal({
        title: '查询范围输入错误',
        content: errorMessages.join(',\t'), // 使用红色字体显示错误信息
        showCancel: false, // 不显示取消按钮
        confirmText: '确定',
        success: function() {
          // 用户点击确定后的处理逻辑
        }
      });
    }else{
      // console.log(this.data)
      this.searchDatabase();
    }
  },
  searchDatabase:function(){
    // 显示加载提示
    wx.showLoading({
      title: '正在查询记录...',
    });
    let _this = this
    wx.cloud.callFunction({
      name: 'search_pattern', // 云函数名称
      data: {
        openid: app.globalData.user_openid, // 替换为实际的openId
        number:  _this.data.number,// 您想要查询的数据数量
        shape: _this.data.shape,
        probability:_this.data.probability,
        sdateStamp:_this.data.sdateStamp,
        edateStamp:_this.data.edateStamp
      },
      success: function(res) {
        // 检查云函数调用是否成功
        if (res.result.success) {
          // 获取云函数返回的数据数组
          const data = res.result.data;
          // 初始化 fileId 和 _id 数组
          let fileIdArray = [];
          let idArray = [];
          // 遍历 data 数组，提取 fileId 和 _id
          data.forEach((item,index) => {
            // 每个元素都有 fileId 属性
            fileIdArray.push(item.fileId[index]); 
            if (item._id) {
              idArray.push(item._id); // 假设每个元素都有 _id 属性
            }
            if (item.shape == 0){
              item.shape = '正常'
            }else{
              item.shape = '瘦身'
            }
            item.probability = String(item.probability) + '%'
          });
          wx.hideLoading();
          // 更新页面数据
          _this.setData({
            patternList: data, // 假设您有一个页面数据项叫 patternList
            fileId: fileIdArray,
            _id: idArray
          });
        } else {
          // 处理错误情况
          console.error(res.result.message);
          wx.hideLoading();
          wx.showToast({
            title: '数据库中没有符合条件的数据',
            icon: 'none',
            duration:2000
          });
          _this.setData({
            patternList: [] ,
            fileId: [] ,
            _id: [],
            _image_name:[]
          });
        }
      },
      fail: function(err) {
        // 云函数调用失败的处理
        wx.hideLoading();
        console.error('云函数调用失败', err);
      }
    })
  },
  //创建excel表格
  create_excel:function(){
    // 显示加载提示
    wx.showLoading({
      title: '正在打开文件...',
    });
    let _this = this
    wx.cloud.callFunction({
      name: 'create_patternExcel',
      data: {
        items: _this.data.patternList // 将数组作为对象的属性传递
      },
      success: function(res) {
        if (res.result.success) {
          // 处理文件下载逻辑
          const fileBuffer = res.result.data;
          const filePath = wx.env.USER_DATA_PATH + '/' + _this.data.date +'.xlsx';
          wx.getFileSystemManager().writeFile({
            filePath: filePath,
            data: fileBuffer,
            encoding: 'binary',
            success: function(res) {
              _this.setData({ 
                filePath:filePath
              });
              wx.openDocument({
                filePath: _this.data.filePath,
                fileType: 'xlsx',
                showMenu: true, // 是否显示右上角菜单按钮，默认false
                success: function (res) {
                  console.log('文件打开成功');
                  wx.hideLoading();
                },
                fail: function (err) {
                  console.error('文件打开失败：', err);
                  wx.hideLoading();
                  wx.showToast({
                    title: '文件打开失败，请重试',
                    icon: 'none',
                    duration:2000
                  });
                }
              });
            },
            fail: function (err) {
              console.error('文件写入失败：', err);
              wx.hideLoading();
              wx.showToast({
                title: '文件写入失败，请重试',
                icon: 'none',
                duration:2000
              });
            }
          });
        } else {
          console.log(res);
          wx.hideLoading();
          wx.showToast({
            title: '生成文件失败,请重试',
            icon: 'none',
            duration: 2000 // 显示时间
          });
        }
      },
      fail: function(err) {
        console.error('云函数调用失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '调用云函数失败',
          icon: 'none',
          duration:2000
        });
      }
    });
  },
  //将数据 导出为excel
  export:function(){
    //可以导出数据
    if(this.data.patternList.length === 0){
      wx.showModal({
        title: '提示', // 提示的标题
        content: '当前无查询数据可供导出', // 提示的内容
        showCancel: false, // 不显示取消按钮
        confirmText: '我知道了', // 确认按钮的文字
        success: function (res) {
        }
      });
    }else{
      const formattedDate = util.formatTime(new Date());
      this.setData({date: formattedDate});
      this.create_excel();
    }
  },
  //根据查询拿到的fileId 和 _id删除数据库记录和云存储文件
  delete:function(){
    // console.log(this.data.fileId)
    // console.log(this.data._id)
    let _this = this
    if (this.data.fileId.length > 0 && this.data._id.length > 0 ) {
      wx.showModal({
        title: '提示', // 提示的标题
        content: '是否删除已查询记录?', // 提示的内容
        showCancel: true, 
        confirmText: '确定', // 确认按钮的文字
        success: function (res) {
          if (res.confirm) {
            // 用户点击了确定按钮
            // 显示加载提示
            _this.deleteData();
          } else if (res.cancel) {
            // 用户点击了取消按钮
            console.log('用户点击了取消');
          }
        }
      });
    } else {
      wx.showToast({
        title: '页面无数据可供删除',
        icon: 'none',
        duration:2000
      });
    }
  },
  deleteData:function(){
    wx.showLoading({
      title: '正在删除记录...',
    });
    let _this = this
    //先删除数据库的记录
    wx.cloud.callFunction({
      name: 'remove_pattern', // 替换为您的云函数名
      data: {
         _id: _this.data._id // 要删除的记录的 _id
      },
      success: function(res) {
        if(res.result.success){
          // 删除云储存的图片
          wx.cloud.deleteFile({
            fileList: _this.data.fileId, 
            success: function(res) {
              //console.log('删除成功', res);
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration:1000
              });
              _this.setData({
                patternList: [] ,
                fileId: [] ,
                _id: []
              });
              _this.getPatternCount();
            },
            fail: function(err) {
              //console.error('删除失败', err);
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'none',
                duration:2000
              });
            }
          });
        }else{
          console.log('删除函数返回结果', res);
        }
      },
      fail: function(err) {
        console.error('调用云函数之删除失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '删除失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  changeShape:function(e){
    const shape = e.detail.value;
    // 根据选中的体型更新
    if (shape == '0') {
      // 如果选中的是“正常”
      this.setData({
        shape: 0,
      });
    } else if (shape == '1') {
      // 如果选中的是“瘦身”，
      this.setData({
        shape: 1,
      });
    }else if (shape == '2') {
      // 如果选中的是“全部”，
      this.setData({
        shape:null,//如果选中全部  那么这个属性就不作为查询数据库的 限制条件
      });
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getPatternCount();
    wx.getSystemInfo({
      success:(res)=> {
        this.setData({
          // totalHeight: (res.windowHeight * 2) - 240
          totalHeight: res.windowHeight - 120
        })
      }
    })
  },
  // 触底事件
  handleScrollToLower(e){
      if(e.detail.direction == 'bottom') {
        console.log('scroll-view触底事件在这里处理加载下一页数据')
      }
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
    this.getPatternCount();
    if(!app.globalData.isLogin){
      wx.showModal({
        title: '提示',
        content: '您需要先登录才能使用',
        showCancel: false, // 不显示取消按钮
        confirmText: '去登录',
        success: res => {
          if (res.confirm) {
            // 用户点击确定，跳转到登录页面
            wx.switchTab({
              url: '/pages/user-center/index'
            });
          }
        }
      });
    }
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

  },
  // 页面滚动时触发
  onPageScroll: function(options) {
    // 检查是否向下滚动
    if (options.scrollTop > 0) { // 当页面滚动距离大于0时隐藏 tabBar
      wx.hideTabBar();
    } else { // 当页面滚动回到顶部时显示 tabBar
      wx.showTabBar();
    }
  },
  // 弹窗打开图片
  openImagePreview: function(e) {
    // 通过e.currentTarget.dataset.index获取传递的索引
    const index = e.currentTarget.dataset.index;
    // 根据索引获取对应的item数据
    const currentItem = this.data.patternList[index];
    const imageId = currentItem.fileId;

    this.getTempFileURL(imageId);
    
    this.getImgPath().then(path => {
      // 执行图片预览（弹窗打开图片）
      wx.previewImage({
        current: path,  // 当前显示图片的http链接
        urls: path,   // 需要预览的图片http链接列表
        success: function() {
          console.log('图片预览成功');
        },
        fail: function() {
          wx.showToast({
            title: '打开图片失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    });
  },
  // 异步函数：等待this.data._avatar_path有值后返回
  async waitForImgPath() {
    // 返回一个Promise，等待_avatar_path不为空
    return new Promise((resolve) => {
      // 定义检查函数
      const checkImgPath = () => {
        if (this.data._img_path) {
          // 当有值时，解析Promise返回结果
          resolve(this.data._img_path);
        } else {
          // 无值时，100毫秒后再次检查
          setTimeout(checkImgPath, 100);
        }
      };
      // 立即开始第一次检查
      checkImgPath();
    });
  },
  //等待获取
  async getImgPath() {
    // 等待异步函数返回结果，赋值给ImgPath
    const ImgPath = await this.waitForImgPath();
    // 此时ImgPath已确保有值，可以进行后续操作
    return ImgPath;
  },
  //获取上传到云存储的图片下载链接, 这个链接是临时的
  getTempFileURL(fileID) {
    let that = this;
    wx.cloud.getTempFileURL({
      fileList: fileID, // 文件ID数组
      success: res => {
        if (res.fileList.length > 0) {
          // 获取文件的临时下载链接
          const fileURL = res.fileList.map(file => file.tempFileURL);
          // 这里可以将文件下载链接返回给服务器
          that.setData({
            ['_img_path']: fileURL // 更新data中的图片下载地址
          });
        }
      },
      fail: err =>{
        console.error(`图片链接获取失败`, err);
        wx.showToast({
          icon:'none',
          title: '图片链接获取失败，请重试',
          duration:2000
        })
      }
    });
  },
})

