/**
 * 产品组件--PTSGame电子系列产品登入
 */
import Global = require("../modules/global");
import Api = require("../../../Global/source/modules/api");

class Product_PTSGame_Login {
	messageNS:string = "Product_PTSGame_Login";

	constructor(){
		this.toLoadSiteMessage();
		//this.init();
	}

	toLoadSiteMessage() {
		Global.Log.log("toLoadSiteMessage");

		//显示系统loading
		Global.Tips.showSystemLoading();

		Api.message.site_message()
			.done((sitemessage)=>{
				//隐藏系统loading，无论显示哪种状态，都需要隐藏系统loading
				Global.Tips.hideSystemLoading();

				if(sitemessage.ptsgame.state) {
					//设置维护内容
					$('[data-cashap-id="maintenanceInfo"]').html(sitemessage.ptsgame.info["zh-cn"]);

					$('[data-cashap-id="state_maintenance"]').removeClass("hide");
				}
				else {
					$('[data-cashap-id="state_open"]').removeClass("hide");

					this.init();
				}
			});
	}

	init(){
		Global.Log.log("Product_PTSGame_Login.init");

		var id = Global.Util.getParam("id");

		if(typeof id == "undefined"){
			Global.Tips.systemTip((<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate(this.messageNS, "id_invalid"), false);
			return;
		}

		//函数：accessCheck，无权限时默认会自行显示提示信息
		if(Global.App.isLogin()){
			Api.account.profile_baseInfo(true)
				.done((baseInfo)=>{
					if(Global.App.accessCheck(Com_Gametree_Cashap.SiteConfig.memberRuleId.PTSGame, baseInfo.memberLevel)){
						this.loadLoginInfo();
						// if(baseInfo.memberLevel == Global.MemberLevel.trial){
						// 	this.loadLoginInfo();
						// }
						// else {
						// 	this.loadLoginInfo();
						// }
					}
				});
		}
		else {
			//判断当前产品允许的访问权限，accessCheck提供默认提示信息，可通过参数声明不使用默认提示信息
			//此处默认会弹出 提示登录 的信息
			Global.App.accessCheck(Com_Gametree_Cashap.SiteConfig.memberRuleId.PTSGame, -1);
		}

		//判断是否未登录，若是则返回退出继续执行
		// if(!Global.App.isLogin()){
		// 	alert((<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "noLogin"));
		// 	window.location.href = Com_Gametree_Cashap.SiteConfig.LoginUrl;//登录页
		// 	return false;
		// }
		//
		// var id = Global.Util.getParam("id");
		//
		// if(typeof id == "undefined"){
		// 	Global.Tips.systemTip((<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate(this.messageNS, "id_invalid"));
		// 	return;
		// }
		//
		// this.loadLoginInfo();
	}

	loadLoginInfo(){
		var id = Global.Util.getParam("id");

		if(id===undefined){
			Global.Tips.systemTip("无法传递有效参数，请重新尝试打开！");
			return;
		}

		var data = {"id":id};

		Api.ptsgame.login_product(data)
			.done((result)=>{
				this.loadLoginInfo_callBack(result);
			});
	}

	loadLoginInfo_callBack(result){
		if(result.errorInfo.length > 0 || !result.result){
			if(result.errorInfo[0].errorCode == "1000015"){
				var text = (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("" , "unknowError");
				Global.Tips.systemTip(text);
				return;
			}

			if(result.errorInfo[0].errorCode == "1000043"){
				var productName =  (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("Model.Game_ID" , "SGGame");
				var text = (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("" , "product_maintenance");
				text = text.replace("{0}" , productName);
				Global.Tips.systemTip(text);
				return;
			}

			if(result.errorInfo[0].errorCode == "" && result.errorInfo[0]["errorDetail"] != ""){
				Global.Tips.systemTip(result.errorInfo[0]["errorDetail"]);
				return;
			}

			Global.Tips.systemTip(Com_Gametree_Cashap.Language["unknowError"]);
			return;
		}

		Global.Log.log("url = %s" , result.url);

		window.location.replace(result.url);
	}
}

export = Product_PTSGame_Login;