define('T009/source/components/Product_VTGame_Login', ["require", "exports", "T009/source/modules/global", "Global/source/modules/api"], function (require, exports, Global, Api) {
    "use strict";
    var Product_VTGame_Login = /** @class */ (function () {
        function Product_VTGame_Login() {
            this.messageNS = "";
            this.toLoadSiteMessage();
            //this.init();
        }
        Product_VTGame_Login.prototype.toLoadSiteMessage = function () {
            var _this = this;
            Global.Log.log("toLoadSiteMessage");
            //显示系统loading
            Global.Tips.showSystemLoading();
            Api.message.site_message()
                .done(function (sitemessage) {
                //隐藏系统loading，无论显示哪种状态，都需要隐藏系统loading
                Global.Tips.hideSystemLoading();
                if (sitemessage.vtgame.state) {
                    //设置维护内容
                    $('[data-cashap-id="maintenanceInfo"]').html(sitemessage.vtgame.info["zh-cn"]);
                    $('[data-cashap-id="state_maintenance"]').removeClass("hide");
                }
                else {
                    $('[data-cashap-id="state_open"]').removeClass("hide");
                    _this.init();
                }
            });
        };
        Product_VTGame_Login.prototype.init = function () {
            var _this = this;
            Global.Log.log("Product_VTGame_Login.init");
            if (Global.App.isLogin()) {
                Api.account.profile_baseInfo(true)
                    .done(function (baseInfo) {
                    if (Global.App.accessCheck(Com_Gametree_Cashap.SiteConfig.memberRuleId.vtgame, baseInfo.memberLevel)) {
                        _this.loadLoginInfo();
                    }
                });
            }
            else {
                //判断当前产品允许的访问权限，accessCheck提供默认提示信息，可通过参数声明不使用默认提示信息
                //此处默认会弹出 提示登录 的信息
                Global.App.accessCheck(Com_Gametree_Cashap.SiteConfig.memberRuleId.vtgame, -1);
            }
        };
        /**
         * 获取产品登录信息
         */
        Product_VTGame_Login.prototype.loadLoginInfo = function () {
            var _this = this;
            var id = Global.Util.getParam("id"), data = {};
            if (id) {
                data = {
                    "id": id
                };
            }
            Api.vtgame.login_product(data)
                .done(function (result) {
                _this.loadLoginInfo_callBack(result);
            });
        };
        Product_VTGame_Login.prototype.loadLoginInfo_callBack = function (result) {
            if (result.errorInfo.length > 0 || !result.result) {
                if (result.errorInfo[0].errorCode == "1000015") {
                    var text = Com_Gametree_Cashap.Language.getMessage_Translate("", "unknowError");
                    Global.Tips.systemTip(text);
                    return;
                }
                if (result.errorInfo[0].errorCode == "1000050") {
                    var productName = Com_Gametree_Cashap.Language.getMessage_Translate("Model.Game_ID", "VTGame");
                    var text = Com_Gametree_Cashap.Language.getMessage_Translate("", "product_maintenance");
                    text = text.replace("{0}", productName);
                    Global.Tips.systemTip(text);
                    return;
                }
                if (result.errorInfo[0].errorCode !== "") {
                    Global.Tips.systemTip(Com_Gametree_Cashap.Language.getMessage_Translate("", result.errorInfo[0]["errorCode"]));
                    return;
                }
                if (result.errorInfo[0].errorCode == "" && result.errorInfo[0]["errorDetail"] != "") {
                    Global.Tips.systemTip(result.errorInfo[0]["errorDetail"]);
                    return;
                }
                Global.Tips.systemTip(Com_Gametree_Cashap.Language["unknowError"]);
                return;
            }
            Global.Log.log("url = %s", result.url);
            window.location.replace(result.url);
        };
        return Product_VTGame_Login;
    }());
    return Product_VTGame_Login;
});
//# sourceMappingURL=/SGMobile_H5App_V1/T009/source/components/Product_VTGame_Login.js.map