// pages/index/index.js
var util = require('../../utils/utils.js');
const app = getApp();

function isNumeric(str) {
  return /^-?\d+(\.\d+)?$/.test(str);
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    //img: '/images/default.png',//图片的本地地址
    imgList: [
      '/images/default.png',
    ],
    date: null,//年月日 小时分钟秒  作为图片存储时的名字
    year:null,//年月日 时间 作为云存储的文件夹名称 方便管理
    timeStamp:null,//date转为时间戳
    type: 0,//图片的上传类型
    messageList: [],
    filePath:'',//excel临时文件路径
    isSave:false,//表单数据是否保存过了
    //控制 数据表单和卵巢表单是否可以输入
    disabled_data: true,
    normal:null,
    abnormal:null,
    /**数据库数据的初始化 */
    //fileId:null,//图片上传云存储 返回的id
    //三张图片的id
    fileId:[],
    _image_name:[], 
    //_image_path:null,//图片的下载地址
    _image_path:[],
    shape:null, //0为正常，1为瘦身(不正常)
    probability:null,
  },
  //提交按钮  只用来调用getFormData
  formSubmit: function(e) {
    this.getFormData(e.detail.value); //获取表单数据 并且校验成功后
  },
  //获取表单数据  其他函数可以使用这个来获取最新的表单数据
  getFormData: function(submittedData) {
    let formData = {};
    if (submittedData) {
      // 如果提供了提交的数据，使用它
      formData = submittedData;
    } else {
      // 否则，从页面数据中获取
      formData = {
        shape: this.data.shape,
        probability: this.data.probability,
      };
    }
    console.log('获取到的表单数据：', formData);
    this.verifyData(formData);
  },
  //校验表单信息是否正确  如果正确则提交到数据库
  verifyData:function(formData){
    //当点击保存结果的按钮时，就判断input输入框内的值是否合法  如果不合法则弹出提示框
    // 定义一个数组来存储所有的错误信息
    const errorMessages = [];
    // 检查每个值,并收集错误信息
    if(formData.probability < 0 || formData.probability > 100){
      errorMessages.push('置信度不在0到100的范围内');
    }
    // 如果有错误信息，循环显示所有的错误信息
    // 如果有错误信息，显示模态对话框
    if (errorMessages.length > 0) {
      wx.showModal({
        title: '输入错误',
        content: errorMessages.join(',\t'), // 使用红色字体显示错误信息
        showCancel: false, // 不显示取消按钮
        confirmText: '确定',
        success: function() {
          // 用户点击确定后的处理逻辑
        }
      });
    } else {
      // 如果没有错误信息，所有值都在范围内，更新data中的字段
      if (formData.shape === '0') {
        this.setData({
          normal:'checked',
          abnormal:'',
        })
      } else if (formData.shape ==='1') {
        this.setData({
          normal:'',
          abnormal:'checked',
        })
      }
      this.setData({
        isSave:true,
        shape:formData.shape,
        probability:formData.probability,
      });
      this.submitDatabase();//将页面的数据提交到数据库
    }
  },


  //将页面数据 提交到数据库
  submitDatabase:function(){
    // 处理表单提交逻辑...  将表单的数据 传入到数据库内  数据库保存成功则返回提示信息
    const db = wx.cloud.database().collection('patternInfo');
    //存入数据库  之前要记得先把input标签获取的string数据转成int数据 再存入数据库
    //预测体型 置信度
    const shape = parseInt(this.data.shape, 10);
    const probability = parseFloat(this.data.probability, 10);
    this.setData({
      shape:shape,
      probability:probability,
    })
    console.log('处理后的表单数据：', this.data);
    //有一种特殊情况 保存结果按钮点的太快了  图片上传云存储还没有结束 还没有返回fileId 这边就准备上传数据库了 这会导致一些值为null
    //所以说 需要先校验每个_image_path和fileId是否存在 如果存在则进行数据库的操作 
    if(Array.isArray(this.data._image_path) && Array.isArray(this.data.fileId) && this.data._image_path.length > 0 && 
      this.data.fileId.length > 0 &&  this.data._image_path.length === this.data.fileId.length) {
      let _this = this //在数据库的操作中 this会改变指向
      //检查数据库 是否有这条记录  重复提交 则覆盖原有的数据
      wx.cloud.database().collection('patternInfo').where({
        _image_name: _this.data._image_name
      }).get({
          success: function(res) {
            // res.data 是包含以上定义的查询结果的数据数组 console.log(res.data[0]);
            // 如果数据库中没有  则添加
            if(res.data.length == 0){ 
              db.add({
                data: {
                  _image_name:_this.data._image_name,
                  _image_path:_this.data._image_path,
                  shape:_this.data.shape,
                  probability:_this.data.probability,
                  fileId:_this.data.fileId,
                  timeStamp:_this.data.timeStamp,
                },
                success: function(res) {
                  // 数据添加成功的处理
                  wx.showToast({
                    title: '保存成功',
                    icon: 'none',
                    duration: 1000 // 显示时间
                  })
                },
                fail: function(err) {
                  // 数据添加失败的处理
                  wx.showToast({
                    title: '保存失败，请重试',
                    icon: 'none',
                    duration: 2000 // 显示时间
                  })
                }
              });
          }else{
            // 如果已经存在了，则覆盖原有的
            db.doc(res.data[0]._id).update({
              data: {
                shape: _this.data.shape,
                probability: _this.data.probability,
              },
              success: function(res) {
                // 数据更新成功的处理
                wx.showToast({
                  title: '更新成功',
                  icon: 'success',
                  duration: 1000 // 显示时间
                });
              },
              fail: function(err) {
                // 数据更新失败的处理
                wx.showToast({
                  title: '更新失败，请重试',
                  icon: 'none',
                  duration: 2000 // 显示时间
                });
              }
            });
          }
        },
        fail: function(err) {
          // 查询失败的处理
          console.error(err);
        }
      });
    }else{
      //点击太快  提示用户再试一次
      wx.showToast({
        title: '点击过快，尚未上传云空间，请重试！',
        icon: 'none',
        duration: 1000 // 显示时间
      });
    }


    
  },
  //创建excel表格
  create_excel:function(){
    let _this = this
    const data = {
      _image_path:String(_this.data._image_path),
      _image_name:_this.data._image_name,
      shape: _this.data.shape,
      probability: String(_this.data.probability) + '%',
    };
    // 显示加载提示
    wx.showLoading({
      title: '正在打开文件...',
    });
    wx.cloud.callFunction({
      name: 'create_patternExcel',
      data: {
        items: [data] // 将数据作为一个数组传递
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
                  // 文件打开成功，隐藏加载提示
                  wx.hideLoading();
                },
                fail: function (err) {
                  console.error('文件打开失败：', err);
                  // 文件打开失败，隐藏加载提示并提示用户
                  wx.hideLoading();
                  wx.showToast({
                    title: '文件打开失败，请重试',
                    icon: 'none',
                    duration:2000
                  });
                }
              });
            },
            fail: function(err) {
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
        wx.showToast({
          title: '调用云函数失败',
          icon: 'none',
          duration:2000
        });
      }
    });
  },
  //将数据 导出为excel
  exportButton(){
    //如果是true的话  说明表单的数据已保存到数据库里了 可以导出数据
    if(this.data.isSave){
      this.create_excel();
    }else{
      wx.showModal({
        title: '提示', // 提示的标题
        content: '表单已更新，请先保存结果再导出', // 提示的内容
        showCancel: false, // 不显示取消按钮
        confirmText: '我知道了', // 确认按钮的文字
        success: function (res) {
        }
      });
    }
  },

  //如果修改表单的数据 就将isSave赋值为false  如果isSave为fasle就不让导出数据
  changeShape:function(e){
    const shape = e.detail.value;
    // 根据选中的体型更新normal和abnormal的值
    if (shape == 0) {
      // 如果选中的是“正常”
      this.setData({
        isSave:false,
        normal:'checked',
        abnormal:''
      });
    } else if (shape == '1') {
      // 如果选中的是“瘦身”，
      this.setData({
        isSave:false,
        normal:'',
        abnormal:'checked'
      });
    }
  },
  
  inputChange: function(e) {
    // 每当输入字段变化时，将 isSave 设置为 false
    this.setData({
      isSave: false,
    });
  },


  onShareAppMessage() {
    return {
      title: '操作菜单',
      path: 'pages/index/index'
    }
  },
  // 图片点击事件
  actionSheetTap() {
    let _this = this
    wx.showActionSheet({
      itemList: ['本地上传（可选多张）', '拍照上传'],
      success(e) {
        if(e.tapIndex==0){
          _this.handleChooseImg('album')  
        }else if(e.tapIndex==1){
          _this.handleChooseImg('camera')  
        }
      }
    })
  },
  // 轮播图切换事件（可选）
  onSwiperChange(e) {
    //console.log("当前轮播图索引", e.detail.current);
    // 在这里处理轮播图切换逻辑
  },

  //获取当前时间的时间戳
  getNowFormatDate:function() {//获取当前时间
    var time = Math.round(new Date() / 1000)
    //console.log("时间戳位:", time);
    return time;
  },
  //把时间戳改成字符串
  dateFormat: function (timestamp) {
    var f = new Date(timestamp * 1000);
    var year = f.getFullYear();
    var month = (f.getMonth() + 1) > 10 ? (f.getMonth() + 1) : '0' + (f.getMonth() + 1);
    var day = f.getDate() > 10 ? f.getDate() : '0' + f.getDate();
    var hour = f.getHours() > 10 ? f.getHours() : '0' + f.getHours();
    var minute = f.getMinutes() > 10 ? f.getMinutes() : '0' + f.getMinutes();
    var second = f.getSeconds() > 10 ? f.getSeconds() : '0' + f.getSeconds();
    var tm = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
    return tm
  },
  // 获取服务器url
  getUrl:function(){
    const db = wx.cloud.database();
    const app = getApp();
  
    // 查询urlInfo表中的所有记录
    db.collection('urlInfo').get({
      success: res => {
        // 检查是否有记录
        if (res.data.length > 0) {
          // 获取第0条记录的url字段
          app.globalData.serverUrl = String(res.data[0].url);
          console.log('获取到的服务器url:', app.globalData.serverUrl);
        } else {
          console.log('未找到关于服务器url的记录');
        }
      },
      fail: err => {
        console.error('查询服务器url失败:', err);
      }
    });
  },
  // 封装的请求函数
  request: function() {
    let _this = this
    // 显示加载提示
    wx.showLoading({
      title: '正在请求服务器...',
    });
    const data = _this.data;
    const app = getApp()
    wx.request({
      // url: '', // 替换为您的本地服务器地址和端口
      url: app.globalData.serverUrl,
      method: 'POST',
      data: {
        img_path: data._image_path,
        openid: app.globalData.user_openid
      },
      header: {
        'content-type': 'application/json' // 指定发送的数据类型
      },
      success: function(res) {
        if (res.statusCode === 200) {
          // 处理服务器返回的数据
          // console.log('服务器返回的数据:', res.data);
          if(res.data.success === true){
            //以下这段代码  写到 接受数据的函数里 
            _this.setData({
              disabled_data: true,
              //下面的 应该从后台拿到数据 赋值给前台
              shape:res.data.form.shape,
              probability:res.data.form.probability,
              normal:null,
              abnormal:null,
            });      
            if(_this.data.shape === 0){
              _this.setData({
                normal:'checked',
                abnormal:'',
              })
            }else if(_this.data.shape === 1){
              _this.setData({
                normal:'',
                abnormal:'checked',
              })
            }else{//如果app.globalData.isDefaultGender为null
              _this.setData({
                normal:null,
                abnormal:null,
              })
            }
            //接下来  已经接收到结果 并展示页面上了  判断是否开启了自动保存结果
            if(app.globalData.isAutoSave){
              // 假设这是您的页面数据
              let formData = {
                shape: _this.data.shape,
                probability: _this.data.probability,
              };
              // 手动调用 formSubmit 函数
              _this.formSubmit({
                detail: {
                  value: formData
                }
              });
            }
            wx.hideLoading();
            wx.showToast({
              title: '识别成功' ,
              icon: 'success',
            });
            // //接下来  已经接收到结果  判断是否开启了自动保存结果
            // if(app.globalData.isAutoSave){
            //   _this.submitDatabase();
            // }
          }else if(res.data.success === False){
            wx.hideLoading();
            wx.showToast({
              title: '服务器图片下载失败，请重试',
              icon: 'none',
              duration:2000
            });
          }
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '服务器连接错误',
            icon: 'none',
            duration:2000
          });
        }
      },
      fail: function(err) {
        console.error('请求失败:', err);
        wx.showToast({
          title: '请求失败',
          icon: 'none',
        });
      }
    });
  },

  handleChooseImg(type) {
    let _this = this
    wx.chooseImage({
      count: 9, // 默认9，设置为1表示只能选择一张图片
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: [type], // 可以指定来源是相册还是相机，默认二者都有'album', 'camera'
      success(res) {
        // 返回选定照片的本地文件路径列表
        const tempFilePaths = res.tempFilePaths;
        const formattedDate = util.formatTime(new Date());
        const yearDate = util.getYMD(new Date());
        const timeStamp = _this.getNowFormatDate();
        // 更新 图片地址 以及 上传时的时间戳
        _this.setData({
          //img: tempFilePaths[0],
          imgList:tempFilePaths,
          imgNum:tempFilePaths.length,
          date: formattedDate,
          year: yearDate,
          timeStamp: timeStamp,
          _image_name: formattedDate
        });
        console.log(`上传图片数量:${_this.data.imgNum}`)
        //console.log(typeof _this.data.timeStamp) number类型 直接传入数据库
        //重置图片id和图片path  防止上一次数据造成污染
        _this.setData({
          fileId:null,
          _image_path:null,
          okCount : 0
        })
        // 遍历 tempFilePaths，逐个上传文件
        tempFilePaths.forEach((path, index) => {
          _this.uploadImage(path, index);
        });
      }
    });
  },
  uploadImage(path,index){//调用n次
    let _this = this
    wx.cloud.uploadFile({//上传至微信云存储
      cloudPath: app.globalData.nickName+'/' + this.data.year + '/' + this.data.date + "_" + index + ".jpg",
      filePath:path,// 本地文件路径
      success: res => {
        // 返回文件 ID
        // _this.setData({
        //   fileId:res.fileID
        // })
        _this.setData({
          [`fileId[${index}]`]: res.fileID, // 将每张图片的 fileID 保存到 data 中
        });
        console.log("上传成功",_this.data.fileId[index]);
        // 获取临时下载链接
        _this.getTempFileURL(res.fileID,index);
      },
      fail: err =>{
        console.error(`第${index + 1}张图片上传失败`, err);
        wx.showToast({
          icon:'none',
          title: '第' + (index + 1) + '张图片上传失败，请重试',
          duration:2000
        })
      }
    })
  },
  getTempFileURL(fileID,index) {//会调用n次 但是request只能调用一次
    const app = getApp()
    let that = this;
    wx.cloud.getTempFileURL({
      fileList: [fileID], // 文件ID数组
      success: res => {
        if (res.fileList.length > 0) {
          // 获取第一个文件的临时下载链接
          const fileURL = res.fileList[0].tempFileURL;
          // 这里可以将文件下载链接返回给服务器 让服务器根据这个图片地址下载图片并分析
          that.setData({
            [`_image_path[${index}]`]: fileURL // 更新data中的图片下载地址
          });
          console.log(`_image_path[${index + 1}]图片下载地址`,that.data._image_path[index]);
          that.data.okCount = that.data.okCount + 1;
          if(that.data.okCount ==  that.data.imgNum){
            this.getUrl();
            const checkServerUrl = () => {
              if (app.globalData.serverUrl) {
                  // 服务器地址已准备好，调用request()
                  console.log("true");
                  this.request();
              } else {
                  // 未准备好，等待100毫秒后再次检查
                  setTimeout(checkServerUrl, 300);
              }
            };
            // 开始检查
            checkServerUrl();
            
            /* 假数据 测试用 */
            that.setData({
              disabled_data: true,
              //下面的 应该从后台拿到数据 赋值给前台
              shape:0,
              probability:95,
              normal:null,
              abnormal:null,
            });      
            if(that.data.shape === 0){
              that.setData({
                normal:'checked',
                abnormal:'',
              })
            }else if(that.data.gender === 1){ 
              that.setData({
                normal:'',
                abnormal:'checked',
              })
            }else{//如果app.globalData.isDefaultGender为null
              that.setData({
                normal:null,
                abnormal:null,
              })
            }
            /*            */

          }
        } else {
          wx.showToast({
            icon:'none',
            title: '获取临时下载链接失败，请重新上传',
            duration:2000
          })
        }
      },
      fail: err => {
        wx.showToast({
          icon:'none',
          title: '获取临时下载链接失败，请重新上传',
          duration:2000
        })
        console.error("获取临时下载链接失败", err);
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //页面加载时 设置这些控件全部不能输入
    this.setData({
      disabled_data: true
    });
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  // 定义一个方法来重置数据
  resetData: function() {
    const data = {
      // img: '/images/default.png',
      imgList: [
        '/images/default.png',
      ],
      date: null,
      messageList: [],
      disabled_data: true,
      male: null,
      female: null,
      _image_name:null, 
      // _image_path: null,
      _image_path: [],
      shape: null,
      probability: null,
    };
    this.setData(data);
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时调用，确保每次进入页面时数据都是初始状态
    if(!app.globalData.isLogin){ 
      this.resetData();
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
    //页面卸载时调用，确保在页面返回时数据被重置
    //this.resetData();
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

})