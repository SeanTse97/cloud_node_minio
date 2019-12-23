db = require('mysql')

var pool = db.createPool({
    host:"localhost",
    user:"root",
    password:"14431",
    database:"dgut"
})

function query(sql,callback){
    pool.getConnection(function(err,connection){
        connection.query(sql, function (err,rows) {
            callback(err,rows)
            connection.release()
        })
    })
}//对数据库进行增删改查操作的基础

exports.query = query
