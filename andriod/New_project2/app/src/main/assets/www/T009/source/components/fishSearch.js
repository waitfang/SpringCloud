define('T009/source/components/fishSearch', ["require", "exports", "T009/source/modules/global", "Global/source/modules/api", "handlebars", "Global/libs/zepto.picLazyLoad"], function (require, exports, Global, Api, Handlebars) {
    "use strict";
    // import BackToTop = require("../../../Global/source/widgets/BackToTop");
    var search = /** @class */ (function () {
        function search(compOption) {
            var _this = this;
            this.messageNS = "";
            this.siteMessage = null;
            this.productList = [];
            this.gameItemContainer = '[data-cashap-id="gameItemContainer"]';
            this.gameItem = '[data-cashap-id="gameItem"]';
            this.tpl_gameItem = '[data-cashap-id="gameItemTpl"]';
            //跑马灯
            this.noticeTpl = '[data-cashap-id="noticeTpl"]';
            this.noticeContent = '[data-cashap-id="noticeContent"]';
            this.marquee = '[data-cashap-id="marquee"]';
            //游戏搜索
            this.searchGameName = "";
            this.gameId = "";
            this.gameNameSearchForm = '[data-cashap-id="GameNameSearch"]';
            this.gameNameInput = 'input[name="gamename"]';
            // 跑马灯讯息
            this.scrollDown = function () {
                $(_this.marquee + " > span").forEach(function (item) {
                    item = $(item);
                    if (item.css("left") == "auto") {
                        item.css("left", "0px");
                    }
                    var left = parseInt(item.css("left").split("px")[0]);
                    var width = item.width();
                    if (left * -1 >= width) {
                        item.css("left", item.parent().css("width"));
                    }
                    else {
                        item.css("left", left - 1);
                    }
                });
                requestAnimationFrame(_this.scrollDown);
            };
            this.page = '[data-cashap-id="' + compOption.page + '"]';
            this.pageName = compOption.page;
            this.init();
        }
        search.prototype.init = function () {
            var _this = this;
            Api.message.site_message(true)
                .done(function (result) {
                Global.Tips.hideSystemLoading();
                _this.siteMessageCallback(result);
            });
            var locationParam = decodeURI(location.search.split('search=')[1]).toLowerCase();
            if (locationParam) {
                this.searchByName(locationParam);
            }
            //绑定gameNameSearch
            $(this.gameNameSearchForm)[0].onsubmit = function () {
                Global.Log.log("gameNameSearchForm submit");
                var name = $(_this.page).find(_this.gameNameInput).val();
                Global.Log.log("searchByName", name);
                _this.searchGameName = name;
                _this.gameId = "";
                _this.searchByName(name);
                return false;
            };
            //绑定游戏点击事件
            $(this.gameItemContainer).delegate(this.gameItem, "tap", function (e) {
                if (e)
                    e.preventDefault();
                var $target = $(e.currentTarget), item = _this.getItemByGameId($($target).attr("data-game-id"), $($target).attr("data-show-type"));
                _this.checkPermission(item);
            });
        };
        search.prototype.siteMessageCallback = function (result) {
            var content = [];
            if (result.result) {
                this.siteMessage = result;
            }
            if (result.result && result.siteMessage) {
                result.siteMessage.forEach(function (item, idx) {
                    //未登录且showTag=false时，不显示当前项。showTag不存在，默认显示
                    if (!Global.App.isLogin() && item.hasOwnProperty("showTag") && !item.showTag) {
                        return;
                    }
                    //isDisplay存在且为false时，不显示当前项
                    if (item.hasOwnProperty("isDisplay") && !item.isDisplay) {
                        return;
                    }
                    var date = new Date(item.startDate), day = date.getDate(), month = date.getMonth() + 1, year = date.getFullYear();
                    day = day >= 10 ? day : "0" + day;
                    month = month >= 10 ? month : "0" + month;
                    item["day"] = day;
                    item["month"] = month;
                    item["year"] = year;
                    content.push(item);
                });
            }
            Global.Log.log("generate data ", content);
            content = content.length === 0 ? [{ content: "" }] : content;
            content.map(function (item) { return item.content; });
            this.setHtml($("#notice-content"), content, $(this.noticeTpl).html());
            this.setMarqueeWidth();
        };
        //设置跑马灯宽度
        search.prototype.setMarqueeWidth = function () {
            var width = 0;
            $(this.marquee + " > span > *").forEach(function (item) {
                width += $(item).width();
            });
            $(this.marquee + " > span").width(width);
            requestAnimationFrame(this.scrollDown);
        };
        search.prototype.setFishProductList = function (data, locationParam) {
            var productList = data.data.filter(function (item) { return item.Name.toLowerCase().indexOf(locationParam) >= 0; });
            for (var i = 0, l = productList.length; i < l; i++) {
                var item = productList[i];
                switch (item.GameName.toLowerCase()) {
                    case 'megawincasino':
                        //item.ShowType 的值目前不清楚 'app' 大小写
                        if (item.GameId === '1051' && item.ShowType === 'H5') {
                            item.imgURL = Com_Gametree_Cashap.Language.fileDomain + "/fishgame2/" + item.GameName + '-' + item.GameId + '-' + item.ShowType + '.jpg';
                        }
                        else {
                            item.imgURL = Com_Gametree_Cashap.Language.fileDomain + "/fishgame2/" + item.GameName + '-' + item.GameId + '-APP.jpg';
                        }
                        break;
                    default:
                        item.imgURL = Com_Gametree_Cashap.Language.fileDomain + "/fishgame2/" + item.GameName + '-' + item.GameId + '.jpg';
                }
                item.memberRule = item.GameName;
            }
            this.gameListData = productList;
            Global.Log.log("game list data ", productList);
            this.setGameList(productList);
        };
        search.prototype.setGameList = function (productList) {
            var list = productList;
            var result = list;
            this.setHtml($(this.gameItemContainer), result, $(this.tpl_gameItem).html());
        };
        search.prototype.checkPermission = function (item) {
            var _this = this;
            //函数：accessCheck，无权限时默认会自行显示提示信息
            if (Global.App.isLogin()) {
                Api.account.profile_baseInfo(true)
                    .done(function (baseInfo) {
                    if (Global.App.accessCheck(item.memberRule, baseInfo.memberLevel)) {
                        _this.openProductURL(item);
                    }
                });
            }
            else {
                //判断当前产品允许的访问权限，accessCheck提供默认提示信息，可通过参数声明不使用默认提示信息
                //此处默认会弹出 提示登录 的信息
                Global.App.accessCheck(item.memberRule, -1);
            }
        };
        search.prototype.openProductURL = function (item) {
            var url;
            switch (item.GameName) {
                case "megawincasino":
                    if (item.ShowType === "APP") {
                        url = item.GameName + "_Login.html?mode=app";
                    }
                    else if (item.ShowType === "H5") {
                        url = item.GameName + "_Login.html?mode=h5&" + item.Param;
                    }
                    break;
                case "MegawinCasinoH5":
                    url = "MegawinCasino_Login.html?mode=h5&gameId=" + item.GameId;
                    break;
                case "slotgame_mgcasino":
                    url = item.GameName + "_Login.html?gameid=" + item.GameId + "&language=zh";
                    break;
                case "bb":
                    url = "bb_Login.html?html=true&game=" + item.GameId + "&mode=game";
                    break;
                case "GNSCasino":
                    url = item.GameName + "_Login.html?key=" + item.GameId;
                    break;
                case "ptcasino":
                    url = "PTCasino_SlotGame_Login.html?" + item.GameId;
                    break;
                case "SlotGame_AGCasino":
                    url = item.GameName + "_Login.html?game=" + item.GameId;
                    break;
                case "CQCasino":
                    url = item.GameName + "_Login.html?gamecode=" + item.GameId + "&gamekind=Slot&gamehall=cq9";
                    break;
                case "JDBGame":
                    url = item.GameName + "_Login.html?GameId=" + item.GameId + "&GameType=" + item.GameCode;
                    break;
                case "DTGame":
                case "vggame":
                    url = item.GameName + "_Login.html?GameKey=" + item.GameId;
                    break;
                case "WG":
                    url = item.GameName + "_Login.html?id=" + item.GameId;
                    break;
                default:
                    url = item.GameName + "_Login.html?gameid=" + item.GameId;
            }
            window.open(url);
        };
        //透过 API回传的 GameId取得物件 及透过 ShowType判断 h5 或 app
        search.prototype.getItemByGameId = function (GameId, ShowType) {
            var result = null;
            for (var i = 0, l = this.gameListData.length; i < l; i++) {
                if (this.gameListData[i].GameId === GameId && this.gameListData[i].ShowType === ShowType) {
                    result = this.gameListData[i];
                    break;
                }
            }
            return result;
        };
        //搜寻游戏
        search.prototype.searchByName = function (locationParam) {
            var _this = this;
            Api.fishgame.product_list()
                .done(function (data) {
                //隐藏系统loading
                Global.Tips.hideSystemLoading();
                _this.setFishProductList(data, locationParam);
            });
        };
        /**
         * 创建html结构
         */
        search.prototype.setHtml = function (target, data, tpl) {
            var template = Handlebars.compile(tpl), html = template(data);
            target.html(html);
        };
        return search;
    }());
    return search;
});
//# sourceMappingURL=/SGMobile_H5App_V1/T009/source/components/fishSearch.js.map