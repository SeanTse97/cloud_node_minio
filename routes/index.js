// routes/index.js
var user = require('./user')
var bodyparser = require('body-parser');
var express = require('express');
var fs = require('fs');
const multer = require('multer');
var cookieParser = require('cookie-parser');
var path = require('path');
const storage = multer.diskStorage({
  // 用来配置文件上传的位置
  destination: (req, file, cb) => {
    // 调用 cb 即可实现上传位置的配置
    cb(null, './images');
  },
  // 用来配置上传文件的名称（包含后缀）
  filename: (req, file, cb) => {
    //filename 用于确定文件夹中的文件名的确定。 如果没有设置 filename，每个文件将设置为一个随机文件名，并且是没有扩展名的。
    // 获取文件的后缀
    let ext = path.extname(file.originalname);
    // 拼凑文件名
    cb(null, req.cookies.uname+'-'+file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({storage: storage});

function detail (app) {  
  
  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({extended:true}));
  app.use(cookieParser());

  //跨域问题 
  app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    //设置cookies
    if(req.path != '/' && req.path != '/loginOut' && req.path !='/login'){
      if(req.cookies.uname=="" || req.cookies.uname == undefined){
	      res.redirect('/');
	      return;
      }
      else
        res.cookie('uname', req.cookies.uname, { maxAge: 15*60*1000, httpOnly: true});
    }
    next();
 });
 //post 提交


//登陆系统
app.post('/login',function(req,res){
  user.login(req,res);
})
 //根路径
app.get('/', function(req,res){
  user.showLogin(req,res);
 });
//首页
app.get('/index',function(req,res){
  user.showIndex(req,res);
})

//获取桶对象
app.get('/getObject',function(req,res){
  user.getObject(req,res);
})
app.get('/getPersonalObject',function(req,res){
  user.getPersonal(req,res);
})
//上传图片
app.post('/upload/image', upload.single('file'), (req, res) => {
    let file = req.file;
    filepath = file.path+"";
    var path = "images/"+filepath.substr(7,filepath.length); 
    user.uploadFile('public',path);
  res.json({code:'0'});
})
app.post('/upload/image/private', upload.single('file'), (req, res) => {
  let file = req.file;
  bucket = req.cookies.uname;
  filepath = file.path+"";
  var path = "images/"+filepath.substr(7,filepath.length); 
  user.uploadFile(bucket,path);
  res.json({code:'0'});
})
//图片上传页面
app.get('/share',function(req,res){
    user.goToShare(req,res);
})
//申请同步
app.post('/reqSync',function(req,res){
   user.reqSync(req,res);
})
//退出登陆
app.get('/loginOut',function(req,res){
  res.cookie('uname', "", { maxAge: 900000, httpOnly: true });
  res.redirect('/');
})
}
module.exports = {
  detail,
}
