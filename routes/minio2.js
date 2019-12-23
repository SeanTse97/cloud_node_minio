var Minio = require('minio')

var minioClient = new Minio.Client({
    endPoint: 'play.min.io',
    port: 9000,
    useSSL: true,
    accessKey: '02K29ZK9I6RTJXV6321S',
    secretKey: 'tpWuRq61Fep7seRdI9fYbazABBPyd1yiSDRdXyI4'
});