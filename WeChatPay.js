/*
 * @Author: your name
 * @Date: 2020-10-23 16:58:25
 * @LastEditTime: 2020-12-23 14:32:58
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \YidangwuGit\BananaShopping_H5\src\mixins\WeChatPay.js
 */


import {
    WechatPayJsapi,
    WechatPayExternal,
    WechatPayScanNative,
    wechatPayExternalStatus,
} from "@/api";

import QRCode from 'qrcodejs2'

// import wx from "weixin-jsapi";

//  < script src = "http://res.wx.qq.com/open/js/jweixin-1.2.0.js" > < /script>


export const weChatPay = {
    data() {
        return {
            failText: '无法支付,请在微信中打开商品链接!',
            // appid
            AppId: 'wx7262f69f24f6ffaa',
            // 域名 微信公众号需要配置回调域名
            Local: '',
            // 微信code
            CODE: '',
            // 订单号
            orderId: '',
            // 商品id
            goodsId: "",
            // 小店id
            shopId: "",
            // 商品数量
            goodsNum: "",
            // 支付按钮 点击支付等待
            submitLoading: false,
            // 支付按钮文案
            submitLoadingText: "支付",
            // 当前支付环境
            currentEnvPay: null,
            // 获取code回调跳转地址 
            redUrl: "http://shopmall.1dang5.com/h5/order_confirm",
        }
    },
    created() {
        // 微信内部调用需获取code
        // 判断当前支付环境
        this.currentEnvPay = this.checkWeChatEnv();
    },
    mounted() {

    },
    methods: {
        /*
        *
         微信内部支付
        */
        async handleWeChatPay() {
            try {
                this.submitLoading = true;
                const {
                    code,
                    data
                    // 提交订单 换取微信内部支付相应参数 具体见 WeixinJSBridgeFunction 中要求参数

                } = await WechatPayJsapi({
                    orderId: this.orderId,
                    orderSource: 2
                });
                // alert(`${code}${data}`);
                if (code == 0) {
                    this.submitLoading = false;
                    this.WeixinJSBridgeFunction(data);
                } else {
                    // this.$router.push({
                    //     name: 'OrderConfirm',

                    // });
                    this.$Toast.loading({
                        message: "支付失败,请重新支付",
                        forbidClick: true,
                        duration: 1000,
                        onClose: () => {
                            this.submitLoading = false;
                            this.submitLoadingText = "重新支付";
                        }
                    });
                }
            } catch (err) {
                this.submitLoading = false;
                this.submitLoadingText = "支付";
            }
        },
        // 调用微信JSBridge接口
        /*
         *@description:*** 的处理方法
         *@author: 肖祥伦
         *@date: 2020-12-23 11:38:47
         *@variable1: 变量1
         *@variable2: 变量2
         *@variable3: 变量3
         *@variable4: 变量4
         *@variable5: 变量5
         */
        WeixinJSBridgeFunction(data) {
            // const temp = typeof WeixinJSBridge === 'undefined';
            if (typeof WeixinJSBridge === 'undefined') {
                this.$Toast({
                    message: '请使用微信内置浏览器支付'
                })
            } else {
                // "appId": 'wx9cxxxxxxxx442c', //公众号名称，由商户传入 ok
                // "timeStamp": wxpay.timeStamp, //时间戳，自1970年以来的秒数 ok    
                //     "nonceStr": wxpay.nonceStr, //随机串     
                //     "package": wxpay.package,
                //     "signType": wxpay.signType, //微信签名方式    
                //     "paySign": wxpay.paySign //微信签名        
                try {
                    // const {
                    //     appId,
                    //     timeStamp,
                    //     nonceStr,
                    //     package,
                    //     signType,
                    //     paySign,
                    //     ...args
                    // ,} = data;
                    WeixinJSBridge.invoke('getBrandWCPayRequest', data,
                        //  {
                        //     "appId": appId, //公众号名称，由商户传入 ok
                        //     "timeStamp": timeStamp, //时间戳，自1970年以来的秒数 ok    
                        //     "nonceStr": nonceStr, //随机串     
                        //     "package": JSON.parse(data).package,
                        //     "signType": signType, //微信签名方式    
                        //     "paySign": paySign //微信签名 
                        // },
                        res => {
                            if (res.err_msg === 'get_brand_wcpay_request:ok') {
                                this.$Toast({
                                    message: '支付成功'
                                });

                                this.$router.replace({
                                    name: "PayResult",
                                    query: {
                                        payStatus: 2,
                                        msg: "支付成功",
                                        orderId: this.orderId
                                    }
                                });
                            } else {
                                this.$Toast({
                                    message: '支付失败'
                                });
                                // alert('支付失败!');
                                this.$router.replace({
                                    name: "PayResult",
                                    query: {
                                        payStatus: 1,
                                        msg: "支付失败",
                                        orderId: this.orderId
                                    }
                                });
                            }
                        }
                    )
                } catch (err) {
                    // alert(`WeixinJSBridge.invoke${err}`)
                }
            }
        },


        /*
        *
        微信外部支付（ 原生浏览器及app）
        */
        async handleExternalWeChatPay() {
            try {
                this.submitLoading = true;
                const {
                    code,
                    data
                    // 外部支付 请求后端返回支付url mweb_url
                } = await WechatPayExternal({
                    orderId: this.orderId,
                    orderSource: 2
                });
                if (code == 0) {
                    // appid: "wxb60176ca0085b563"
                    // mch_id: "1603107697"
                    // mweb_url: "https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=wx2915290987597835aa1024eae120660000&package=1826169598"
                    // nonce_str: "NdCePwA2SV3FkFfb"
                    // prepay_id: "wx2915290987597835aa1024eae120660000"
                    // sign: "C16EF79FBEA572D739747229891EEAED"
                    const {
                        mweb_url
                    } = data;
                    // console.log("WechatPayExternal",
                    //     data)
                    const url = encodeURIComponent(`http://shopmall.1dang5.com/h5/order_status?orderId=${this.orderId}`);
                    const MWEB_URL = mweb_url + `&redirect_url=${url}`;
                    window.location.replace(MWEB_URL);
                } else {
                    this.$Toast.loading({
                        message: "未获取到支付链接,请重新下单",
                        forbidClick: true,
                        duration: 1000,
                    });
                }
            } catch (err) {
                this.submitLoading = false;
                console.log("handleWeChatPay1111",
                    err)
            }
        },



        /*
        *
        native方式 弃用
        */
        handleWeChatNativePay({
            refsEles,
            params
        }) {
            return new Promise(async (resolve) => {
                const {
                    code,
                    data
                } = await WechatPayScanNative(params);
                console.log("WechatPayScanNative", data)
                if (code == 0) {
                    const {
                        code_url
                    } = data;
                    this.creatQrCode({
                        refsEles,
                        strUrl: code_url
                    });
                    resolve(true)
                } else {
                    resolve(false)
                }
            }).catch(err => {
                console.log("handleWeChatNativePay",
                    err)
            })

        },
        // 长按方法 轮询调用
        handleLoginPress() {
            // alert("handleLoginPress");
            console.log("handleLoginPress");
        },
        // 查询用户支付状态
        getWechatPayExternalStatus(order) {
            return new Promise(async (reslove) => {
                const {
                    code,
                    // data,
                    msg
                } = await wechatPayExternalStatus(order);
                if (code == 0) {
                    reslove({
                        code,
                        msg
                    })
                    // if (data == 1) {
                    //     reslove(true)
                    // }
                    // if (data == 2) {
                    //     reslove(false)
                    // }

                } else {
                    reslove({
                        code,
                        msg
                    })
                }
            })
        },



        /** 其他方法*/
        // 获取code
        getCode(params) {
            // 如果有参数 则为下单页面传参进获取code页
            if (params) {
                const {
                    orders,
                    redUrl
                } = params;
                // 存入session中 orders信息
                sessionStorage.setItem('orders', JSON.stringify(orders));
                this.Local = redUrl;
            };
            const code = this.getUrlParam('code');
            if (code == null || code == "") {
                https: //open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect
                    window.location.replace(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${this.AppId}&redirect_uri=${encodeURIComponent(this.Local)}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`)
                // alert(window.location.href);
            }
            else {
                this.CODE = code;
            }
            return code;
        },
        // 获取选购商品页面传送的订单消息
        getOrdersParams() {
            const obj = sessionStorage.getItem('orders');
            if (obj) return obj
            return null;
        },
        // 是否已经获取到code码 从session中获取
        isHasAppCode() {
            // 获取商品信息
            const code = this.getCode();
            // 我获取到code 回跳页面
            if (!code) {
                const {
                    shopId,
                    goodsId,
                    goodsNum
                } = JSON.parse(sessionStorage.getItem("orders"));
                this.$Toast.loading({
                    message: "生成订单失败,请稍后重试!",
                    forbidClick: true,
                    duration: 1000,
                    onClose: () => {
                        this.$router.push({
                            name: "Goods",
                            query: {
                                shopId,
                                goodsId,
                                goodsNum
                            }
                        });
                    }
                });
                return false;
            }
            sessionStorage.setItem('appCode', code);
            return true;
        },
        // 检测是否在微信环境下 2 内部 1 外部 3 扫码
        checkWeChatEnv(scan) {
            // return 3
            if (scan == 'scan') return 3;
            console.log("navigator.userAgent", navigator.userAgent);
            if (navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == "micromessenger") {
                return 2;
            } else {
                return 1;
            }
        },
        // 截取code方法
        getUrlParam(name) {
            const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
            const url = window.location.href.split('#')[0];
            const search = url.split('?')[1];
            if (search) {
                const r = search.substr(0).match(reg);
                if (r !== null) return unescape(r[2]);
                return null
            } else return null
        },

        // 生成二维码
        creatQrCode({
            refsEles,
            strUrl
        }) {
            const qrcode = new QRCode(refsEles[0], {
                text: strUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                // correctLevel: QRCode.CorrectLevel.H
            });
            // 解决二维码图片在华为小米手机上无法识别的问题 隐藏原组件Canvas元素 新建div插入二维码图片
            const canvas = document.getElementsByTagName('canvas')[0];
            const image = new Image();
            console.log("strUrl", strUrl)
            if (!strUrl) {
                image.src = require('@/assets/qrcode.png');
                refsEles[1].append(image);
                return
            }
            image.src = canvas.toDataURL("image/png");
            refsEles[1].append(image);
            console.log(qrcode)
        },

        // npm install qrcodejs2--save
        // 复制订单号

        // < img src = "../assets/fuzhi.png"
        // class = "cobyOrderSn"
        // data - clipboard - action = "copy": data - clipboard - text = "orderInfo.orderNum"
        // @click = "copyOrderNum" >
        copyOrderNum() {
            let _this = this;
            let clipboard = new this.clipboard(".cobyOrderSn");
            clipboard.on("success", function () {
                _this.$Toast("复制成功");
            });
            clipboard.on("error", function () {
                _this.$Toast("复制失败");
            });
        },
    }
}