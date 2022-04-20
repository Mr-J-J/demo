
const log4js = require('log4js');


log4js.configure({
  appenders: {
   cheese: {
    type: 'recording',
    //  filename: 'log/cheese.log',
    //  maxLogSize:10000,//文件最大存储空间，当文件内容超过文件存储空间会自动生成一个文件test.log.1的序列自增长的文件
    layout: {
      type: 'pattern',
      pattern: '[%d] - %m%n'
    }
	} 
},
  categories: { default: { appenders: ['cheese'], level: 'info' } }
});

const logger = log4js.getLogger('cheese');

module.exports=logger;

// logger.trace('1this is trace');
// logger.debug('this is debug');
// logger.info('this is info');
// logger.warn('this is warn');
// logger.error('this is error');
// logger.fatal('this is fatal');

// 这里是获取log信息到变量里
// const recording = require('log4js/lib/appenders/recording');
// var events = recording.replay();
// console.log(events);
// var events = recording.reset();