var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var Fs = require('fs');
var db = require('./db');
var pages = path.join(__dirname,'../');
var Minio = require('minio');

let name = new Array();
let picUrl = new Array();

var minioClient = new Minio.Client({
    //endPoint: '111.229.43.122',
    endPoint:'192.168.159.132',
    port: 9000,
    useSSL: false,
    accessKey: '02K29ZK9I6RTJXV6321S',
    secretKey: 'tpWuRq61Fep7seRdI9fYbazABBPyd1yiSDRdXyI4'
});
//查询一行（传参)    
let select = (table,name,attributename, attribute) => {
    return new Promise((resolve, reject) => {
      db.query(`select ${name} from ${table} where ${attributename} = '${attribute}'`, (err, rows) => {
        if(err) {
          reject(err);
        }
        resolve(rows);
      })
    })
  }
//插入数据
let insert = (userName,devId,devName) => {
  return new Promise((resolve, reject) => {
    db.query(`insert into record values('${userName}','${devId}','${devName}','F')`, (err, rows) => {
      if(err) {
        reject(err);
      }
      resolve(rows);
    })
  })
}
//创建bucket
function createBucket(bucketName){
  minioClient.makeBucket(bucketName, 'us-east-1', function(err) {
    if (err) return console.log('Error creating bucket.', err) 
    console.log('Bucket created successfully in "us-east-1".')
  })
}
//获取对象
function getObjects(bucketName,prefix,callback){
  var stream = minioClient.listObjectsV2(bucketName,prefix, true,'');
  stream.on('data', function(obj) {
      name.push(obj.name);
  })
  stream.on('end',function(){
    getObjectsUrl(bucketName);
    callback();
  })
  stream.on('error', function(err) { 
    console.log(err) 
    callback(err);
  } )
}
function getObjectsUrl(bucketName){ 
  picUrl.length = 0;
  for(var i=0;i<name.length;i++){
      minioClient.presignedUrl('GET',bucketName , name[i], 24*60*60, function(err, presignedUrl) {
      if (err) return console.log(err);
      picUrl.push(presignedUrl);
    })
  }
  name.length = 0;
}
//promise 写法
let getObj = (bucketName,prefix)=>{
  return new Promise((resolve, reject) => {
    getObjects(bucketName, prefix, err => {
      if(err) {
        reject(err);
      }
      resolve();
    })
  })
}
 //上传对象
function uploadFile(bucket,file){
  var fileStream = Fs.createReadStream(file)
  var fileStat = Fs.stat(file, function(err, stats) {
  if (err) {
    return console.log(err)
  }
  minioClient.putObject(bucket, file, fileStream, stats.size, function(err, etag) {
    return console.log(err, etag) 
  })
 
})
}
//删除对象
function deleteObject(bucketName,object){
  minioClient.removeObject(bucketName, object, function(err) {
    if (err) {
      return console.log('Unable to remove object', err)
    }
    console.log('Removed the object')
  })
}

//登陆页面
function showLogin(req,res){
  var options = {
    root: pages + 'views//',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
  res.sendFile('login.html', options, function (err) {
    if (err) {
      console.log(err);
    }
  });
}
//登陆函数
async function login(req,res){
  var name = req.body.userName;
  var pass = req.body.password;
  var msg = '';
  try{
    var result = await select('account','password','user_name',name);
    if(result.length==0){
      msg = "用户名错误";
      res.send({code:'0',msg:msg});
    }else if(result[0].password == pass){
      var b = await minioClient.bucketExists(name);
      if(!b){
          createBucket(name);
      }
      res.cookie('uname', name, { maxAge: 30*60*1000, httpOnly: true});
      res.redirect('/index');
    }else{
      msg = "密码错误";
      res.send({code:'0',msg:msg});
    }
    
  }catch(e){
    console.log(e)
    res.send({code:'1',msg:'服务器出错了'});
  }
}

//首页
function showIndex(req,res){
    if(req.cookies.uname == ''){
      res.redirect('/');
      return;
    };
    var options = {
      root: pages + 'views//',
      dotfiles: 'deny',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    };
    name.length = 0;
    //getObjects('public');
    res.sendFile('showPic.html', options, function (err) {
      if (err) {
        console.log(err);
      }
    });
   
}

//上传页面
function goToShare(req,res){
  var options = {
    root: pages + 'views//',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
  res.sendFile('uploadFile.html', options, function (err) {
    if (err) {
      console.log(err);
    }
  });
}

//获取对象
async function getObject(req,res){
  res.header("Content-Type", "application/json;charset=utf-8");
  try{
    await getObj('public','/images');
    res.send({data:picUrl,user:req.cookies.uname});
  }catch(e){
    console.log(e);
  }  
}

async function getPersonal(req,res){
    res.header("Content-Type", "application/json;charset=utf-8");
    var uname = req.cookies.uname;
    var temp = new Array(); 
    try{
      await getObj(uname,'/images/');
      res.send({data:picUrl});
    }catch(e){
      console.log(e);
    }
}
//请求同步设备
async function reqSync(req,res){
    var uname = req.cookies.uname;
    var devId = req.body.devId;
    var devName = req.body.devName;
    try{
      result = await insert(uname,devId,devName);
      res.send({msg:"申请成功,请耐心等候！"});
    }catch(e){
      console.log(e);
      res.send({msg:"申请失败"});
    }
    
}
module.exports = {
	showIndex,getObject,goToShare,uploadFile,login,showLogin,getPersonal,reqSync
}
