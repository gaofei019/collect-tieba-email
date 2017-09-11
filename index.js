'use strict';
const getUrl=require('./libs/getUrl'),
      gbk=require('gbk'),
      jsdom=require('jsdom').jsdom,
      fs=require('fs'),
      trimHtml=require('trim-html');
fs.readFile('./target/urls.txt','utf-8',function(err,data){//读取抓取目标地址文件
    if(err){
        console.log('写入有错',err);
    }else{
        var dataArr=data.split('\r\n');
        for(let [index,elem] of dataArr.entries()){//循环抓取数据
            init(elem,index);
        }
    }
});
function init(url,index){//抓取数据方法
    getPageCount(url).then(
        function(data){
            var pageCount=data[0].pageCount;
            getPages(url,pageCount).then(
                function(data){
                    console.log(`一共${data.length}个数据`);
                    //抓取成功后，写入data目录里
                    fs.writeFile(`./data/email_${index}.txt`,data.join('\r\n'),{flag: 'a'},function(err){
                        if(err){
                            console.log('写入有错',err);
                        }else{
                            console.log('写好了');
                        }
                    });
                },function(err){
                    console.log(err);
                }
            );
        },function(err){
            console.log(err);
        }
    );
};
/*getPageCount('http://tieba.baidu.com/p/4229061162').then(
    function(data){
        var pageCount=data[0].pageCount;
        getPages('http://tieba.baidu.com/p/4229061162',pageCount).then(
            function(data){
                console.log(`一共${data.length}个数据`);
                fs.writeFile('./data/email.txt',JSON.stringify(data),function(err){
                    if(err){
                        console.log('写入有错',err);
                    }else{
                        console.log('写好了');
                    }
                });
            },function(err){
                console.log(err);
            }
        );
    },function(err){
        console.log(err);
    }
);*/

/*getBaiduPages('python',2).then(
    function(data){
        console.log(data);
    },function(err){
        console.log(err);
    }
);*/

function getPages(url, page_count){
    return new Promise(function(resolve, reject){
        var i=1;
        var result=[];

        _qu();
        function _qu(){
            getFromListHTML(url,i).then(function(data){
                result=result.concat(data);
                i++;
                if(i<=page_count){
                    _qu();
                }else{  
                    resolve(result);
                }
            }, reject);
        };
    });
};

/*function getBaiduPages(keyword, page_count){
    return new Promise(function(resolve, reject){
        var i=1;
        var result=[];

        _qu();
        function _qu(){
            getFromListHTMLtoBaidu(keyword,i).then(function(data){
                result=result.concat(data);
                i++;
                if(i<=page_count){
                    _qu();
                }else{  
                    resolve(result);
                }
            }, reject);
        };
    });
};*/

function getPageCount(url){
    return new Promise(function(resolve, reject){
        var i=1;
        var result=[];

        _qu();
        function _qu(){
            getFromListHTMLtoPageCount(url,i).then(function(data){
                result=result.concat(data);
                resolve(result);
            }, reject);
        };
    });
};
/*function getFromListHTMLtoBaidu(keyword, page){

    var url = `https://www.baidu.com/s?wd=site%3Atieba.baidu.com%20${encodeURIComponent(keyword)}%20%E9%82%AE%E7%AE%B1&pn=${(page-1)*10}&oq=site%3Atieba.baidu.com%20python%20%E9%82%AE%E7%AE%B1&tn=50000021_hao_pg&ie=utf-8&rsv_pq=a95de61b0000748b&rsv_t=8481gsQroDX7HYwBzimPBZNxh5NX1XOz8Je4ZBMgV5xBILITiie8R%2BEQArryvM6sYiGaw8Zt&srcqid=1227457316821399132`;
    
    return new Promise(function(resolve, reject){
        getUrl(url).then(function(data){
            var str=data;
            var document=jsdom(str);
            var searchLink=document.querySelectorAll('#content_left div.result h3.t a');
            var aData=[];
            for(var item of searchLink){
                try{
                    aData.push(item.href);
                }catch(e){};
            }
            console.log(aData);
            resolve(aData);
        }, reject);
    });
};*/
function getFromListHTMLtoPageCount(url, page){

    var url=`${url}?pn=${page}`;
    
    return new Promise(function(resolve, reject){
        getUrl(url).then(function(data){
            var str=data;

            var document=jsdom(str);
            var pageCount=document.querySelectorAll('#thread_theme_5 .l_reply_num .red')[1].innerHTML;
            resolve({"pageCount":pageCount});
        }, reject);
    });
};
function getFromListHTML(url, page){

    var url=`${url}?pn=${page}`;
    
    return new Promise(function(resolve, reject){
        getUrl(url).then(function(data){
            /*function normalizeCount(str){
                if(str.endsWith('万')){
                    return parseInt(parseFloat(str)*10000);
                }else if(str.endsWith('亿')){
                    return parseInt(parseFloat(str)*100000000);
                }else{
                    return parseInt(str);
                }
            }*/
            var str=data;
            var aData=[];
            var bData=[];
            var itemStr='';
            var resultData;

            var document=jsdom(str);
            var dPostContent=document.querySelectorAll('.j_d_post_content');
            var replyContent=document.querySelectorAll('.lzl_content_main');
            //console.log([...replyContent]);
            var regPattern=/[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/;

            for(var item of dPostContent){
                try{
                    itemStr=trimHtml(item.innerHTML,{preserveTags:true}).html.replace(/<[^>]+>/g,"");
                    itemStr=itemStr.match(regPattern).length?itemStr.match(regPattern).join(''):'';
                    aData.push(itemStr);
                }catch(e){};
            }
            for(var item of replyContent){
                try{
                    itemStr=trimHtml(item.innerHTML,{preserveTags:true}).html.replace(/<[^>]+>/g,"");
                    itemStr=itemStr.match(regPattern).length?itemStr.match(regPattern).join(''):'';
                    bData.push(itemStr);
                }catch(e){};
            }

            resultData=[... new Set([...aData,...bData])];//合并并去重
            resolve(resultData);
        }, reject);
    });
};


