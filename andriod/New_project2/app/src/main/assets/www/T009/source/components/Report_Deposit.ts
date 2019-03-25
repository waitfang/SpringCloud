/**
 * 报表--存取款记录
 */
import Global = require("../modules/global");
import Api = require("../../../Global/source/modules/api");
import moment = require("moment");
import Handlebars = require("handlebars");

// import BackToTop = require("../../../Global/source/widgets/BackToTop");

class Report_Deposit {
    formName: string;
    formElement: JQuery;

    messageNS: string = "Report_Deposit_Drawings_Money";

    formInput = {
        "startDate": "input[name=startDate]",
        "endDate": "input[name=endDate]",
        "operationType": "select[name=operationType]",
        "operationState": "select[name=operationState]",
        "operationMethod": "select[name=operationMethod]"
    }

    //submit按钮文字元素
    submitText: string = "[data-cashap-id=submitText]";

    //submit按钮元素
    submitBtn: string = "[data-cashap-id=submitBtn]";

    searchOverLay = $("[data-cashap-id=SideBarSearch]").find("[data-cashap-id=sidebarOverlay]");

	/**
	 * submit按钮文字内容(临时存放)
	 * @type string
	 */
    submitTextContent: string;

	/**
	 * 是否提交中
	 * @type {boolean}
	 */
    isSubmitting: boolean = false;

    conditionElement = "[data-cashap-id=condition]";

    //日期格式
    DateFormat = 'YYYY-MM-DD';
    Show_DateFormat = "YYYY-MM-DD";

    //是否启用时间选择，默认不启用(false)
    timePicker: boolean;

    content = null;//报表数据明细
    total = null;//报表数据合计

    stateTable = '[data-cashap-id=stateTable]';//加载中、无记录 状态
    contentTable = "[data-cashap-id=contentTable]";
    contentTpl = "[data-cashap-id=contentTableTpl]";
    totalTable = "[data-cashap-id=totalTable]";
    totalTpl = "[data-cashap-id=totalTableTpl]";

    //交易状态(枚举)
    ReportOperationState;

    //交易类型(枚举)
    ReportOperationType;

    //交易方式(枚举)
    ReportOperationMethod;

    recordListContainer = '[data-cashap-id="recordList"]';
    scrollContainer = '[data-cashap-id="scrollContainer"]';

    // 筛选面板
    FilterPannal = '[data-cashap-id="FilterPannal"]';
    FilterPannalShowBtn = '[data-cashap-id="btnSideBarSearch"]';
    FilterPannalHideBtn = '[data-cashap-id="FilterPannalHideBtn"]';

    constructor(option: {formName: string; timePicker?:boolean; tplContentTable: string;}) {
        if(!option.hasOwnProperty("timePicker")) {
            option.timePicker = false;
        }

        this.contentTpl = option.tplContentTable;

        this.formName = option.formName;
        this.formElement = $("[name='" + option.formName + "']");
        this.timePicker = option.timePicker;

        if (option.timePicker) {
            this.DateFormat += "THH:mm";
            this.Show_DateFormat += " HH:mm";

            this.formElement.find(this.formInput.startDate).attr("type", "datetime-local");
            this.formElement.find(this.formInput.endDate).attr("type", "datetime-local");
        }
        else {
            this.formElement.find(this.formInput.startDate).attr("type", "date");
            this.formElement.find(this.formInput.endDate).attr("type", "date");
        }

        this.ReportOperationType = Com_Gametree_Cashap.Language["Report_DepositDrawings_OperationType"];
        this.ReportOperationMethod = Com_Gametree_Cashap.Language["Report_DepositDrawings_OperationMethod"];
        this.ReportOperationState = Com_Gametree_Cashap.Language["Report_DepositDrawings_OperationState"];

        this.init();
    }

    init() {
        //判断是否未登录，若是则返回退出继续执行
        if (!Global.App.isLogin()) {
            Global.Tips1.show({
                tipsTit:(<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "SystemTips"),
                tipsContentTxt: (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "noLogin"),
                leftbtnShow: true,
                leftbtnTxt: (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "OK"),
                leftbtnfunction: ()=>{
                    window.location.href = Com_Gametree_Cashap.SiteConfig.LoginUrl;
                    Global.Tips1.hide();
                }
            });
            return false;
        }

        Api.account.profile_baseInfo(true)
            .done((baseInfo) => {
                if (baseInfo.memberLevel == Global.MemberLevel.trial) {
                    //提示仅提供正式会员操作
                    Global.Tips1.show({
                        tipsTit:(<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "SystemTips"),
                        tipsContentTxt: (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "onlyMember"),
                        leftbtnShow: true,
                        leftbtnTxt: (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "OK"),
                        leftbtnfunction: ()=>{
                            window.location.href = Com_Gametree_Cashap.SiteConfig.LoginUrl;
                            Global.Tips1.hide();
                        }
                    });
                }
                else {
                    this.afterInit();
                }
            });

        //绑定筛选面板显示按钮事件
        $(this.FilterPannalShowBtn).tap(() => {
            console.log("FilterPannal is Show");
            this.FilterPannalShow();
        });

        $(this.FilterPannalHideBtn).tap(() => {
            console.log("FilterPannal is hide");
            this.FilterPannalHide();
        });

        Global.Log.log("Report_Deposit.init");
    }

    afterInit() {
        //设置startDate、endDate初始值
        this.setDate();

        //设置交易类型
        this.setOperationType();

        //设置交易方式
        this.setOperationMethod();

        //设置交易状态
        this.setOperationState();

        //电子版默认不自动读取数据
        // this.submit();

        //开始结束日期
        $(this.conditionElement).on("input", "input", (e: Event) => {
            var target = e.target || e.srcElement,
                value = this.dateFormat($(target).val(), this.Show_DateFormat),
                showTarget = $(target).attr("data-value-show-target");

            $(showTarget).text(value);
        });

        //交易类型、交易方式、交易状态
        $(this.conditionElement).delegate("select", "change", (e: Event) => {
            var target = e.target || e.srcElement,
                value = $(target).val(),
                showTarget = $(target).attr("data-value-show-target");

            $(showTarget).text($(target).find("[value='" + value + "']").text());
        });

        //绑定提交按钮
        this.formElement.find(this.submitBtn).on("tap", (e: Event) => {
            if (e.preventDefault) e.preventDefault();

            // 检查开始日期，和结束日期
			if(!this.checkDate()){
				Global.Tips.systemTip((<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "start_endTime_invalid"));
				return false;
			}

            this.searchOverLay.trigger("tap");

            this.submit();

        });

        $(this.contentTable).delegate("[data-cashap-id=operationType]", "click", (e: Event) => {
            e.preventDefault();

            var target = e.target || e.srcElement,
                tr = $(target).parents("tr"),
                isActive = tr.hasClass("active");

            //若当前已经显示隐藏部分，则隐藏，否则显示
            if (isActive) {
                tr.removeClass("active");
                tr.next().addClass("hide");
            }
            else {
                tr.addClass("active");
                tr.next().removeClass("hide");
            }
        });

        //顶层数据 回到顶部
        // new BackToTop({
        // 	toTopDomParentContainer: $(this.recordListContainer),
        // 	scrollContainer: $(this.scrollContainer)
        // });
    }

    dateFormat(date: string, formatter: string) {
        return moment(date).format(formatter);
    }

	/**
	 * 设置startDate、endDate初始值
	 */
    setDate() {
        var now, firstDay, firstDate;
        now = moment();
        firstDay = now.date();
        console.log("now: "+now)
        console.log("firstDay: "+firstDay)
        if (firstDay == 1) {
            firstDate = this.timePicker ? now.hours(0).minutes(0).seconds(0).format(this.DateFormat) : now.format(this.DateFormat);
        }
        else {
            firstDate = this.timePicker ? now.set("date", 1).hours(0).minutes(0).seconds(0).format(this.DateFormat) : now.set("date", 1).format(this.DateFormat);
        }

        //设置日期控件
        var startDate = this.formElement.find(this.formInput.startDate);
        if (startDate.length > 0) {
            startDate.val(firstDate);

            var showTarget = startDate.attr("data-value-show-target");
            $(showTarget).text(this.dateFormat(firstDate, this.Show_DateFormat));
            //setTimeout(()=>{
            //	startDate.trigger("change");
            //});
        }

        var endDate = this.formElement.find(this.formInput.endDate);
        if (endDate.length > 0) {
            var endTime = moment().format(this.DateFormat);
            endDate.val(endTime);

            var showTarget = endDate.attr("data-value-show-target");
            $(showTarget).text(this.dateFormat(endTime, this.Show_DateFormat));
            //setTimeout(()=>{
            //	endDate.trigger("change");
            //});
        }
    }

	/**
	 * 设置交易类型
	 */
    setOperationType() {
        var operationType = this.formElement.find(this.formInput.operationType);

        if (operationType.length > 0) {
            var typeList = this.ReportOperationType,
                html = "";

            for (var i = 0, l = typeList.length; i < l; i++) {
                //过滤 "活动-一倍打码"（5），"活动-无打码"（6）
                if (typeList[i].value == 5 || typeList[i].value == 6) {
                    continue;
                }

                html += '<option value="' + typeList[i].value + '">' + typeList[i].name + '</option>';
            }

            operationType.append(html);
            setTimeout(() => {
                operationType.trigger("change");
            }, 100);
        }
    }

	/**
	 * 设置交易方式
	 */
    setOperationMethod() {
        var operationMethod = this.formElement.find(this.formInput.operationMethod);

        if (operationMethod.length > 0) {
            var methodList = this.ReportOperationMethod,
                html = "";

            for (var i = 0, l = methodList.length; i < l; i++) {
                html += '<option value="' + methodList[i].value + '">' + methodList[i].name + '</option>';
            }

            operationMethod.append(html);
            setTimeout(() => {
                operationMethod.trigger("change");
            }, 100);
        }
    }

	/**
	 * 设置交易状态
	 */
    setOperationState() {
        var operationState = this.formElement.find(this.formInput.operationState);

        if (operationState.length > 0) {
            var stateList = this.ReportOperationState,
                html = "";

            for (var i = 0, l = stateList.length; i < l; i++) {
                html += '<option value="' + stateList[i].value + '">' + stateList[i].name + '</option>';
            }

            operationState.append(html);
            setTimeout(() => {
                operationState.trigger("change");
            }, 100);
        }
    }

	/**
	 * 数据查询表单提交
	 */
    submit() {
        //防止用户在本次操作未完成时重复提交
        if (this.isSubmitting) {
            var text = (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate(this.messageNS, "submiting");
            Global.Tips.systemTip(text);
            return;
        }

        var form_data = this.getAllFormData();

        this.FilterPannalHide();
        
        if (form_data) {
            //31天查询区间判断
            var validCheck = moment(form_data.startDate).add(31, "d").isAfter(form_data.endDate);
            if (!validCheck) {
                var text = (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate(this.messageNS, "2204001");
                Global.Tips.systemTip(text);
                return;
            }

            //显示系统loading
            Global.Tips.showSystemLoading();

            //重新提交查询时，显示数据加载中及loading
            var contentTable = $(this.contentTable),
                stateTable = $(this.stateTable);

            contentTable.addClass("hide");

            stateTable.removeClass("no-record hide");
            stateTable.addClass("loading");

            //防止重复提交
            this.isSubmitting = true;

            //临时添加此操作，获取acc一并提交
            var acc = Global.Util.getParam("acc");
            if (acc) {
                form_data["account"] = acc;
            }

            Api.report.deposit_drawings_money(form_data)
                .done((result) => {
                    this.submitCallback(result);
                });
        }
    }

	/**
	 * 报表查询回调
	 */
    submitCallback(result) {
        //隐藏系统loading
        Global.Tips.hideSystemLoading();

        if (result.errorInfo != undefined) {
            if (result.errorInfo.length > 0) {
                this.submitError(result.errorInfo[0]);
                return;
            }
        }

        //每次加载数据前先清空旧有数据
        this.content = [];

        var content = [],
            total = [],
            len = result.data.length;

        if (len > 0) {
            for (var i = 0; i < len; i++) {
                var obj = {};

                for (var x = 0; x < result.fields.length; x++) {
                    obj[result.fields[x]] = result.data[i][x];
                }

                obj["rowIndex"] = i;

                if (i % 2 == 0) {
                    obj["rowClass"] = "";
                } else {
                    obj["rowClass"] = "InterlaceBg";
                }

                obj["rowID"] = "Detail_" + obj["id"];

                obj["operationStateName"] = "";
                if (obj["operationState"]) {
                    var state = this.getOperateStateItemByValue(obj["operationState"]);
                    if (state) {
                        obj["operationStateName"] = state.name;
                    } else {
                        Global.Log.log("operationStateName not found , value = %s", obj["operationState"]);
                    }
                }

                obj["operationTypeName"] = "";
                if (obj["operationType"]) {
                    var type = this.getOperateTypeItemByValue(obj["operationType"]);
                    if (type) {
                        obj["operationTypeName"] = type.name;
                    } else {
                        Global.Log.log("operationTypeName not found , value = %s", obj["operationType"]);
                    }
                }

                obj["operationMethodName"] = "";
                if (obj["operationMethod"]) {
                    var method = this.getOperateMethodItemByValue(String(obj["operationMethod"]));
                    if (method) {
                        obj["operationMethodName"] = method.name;
                    } else {
                        //新现金为中文，不在枚举范围内，直接显示
                        obj["operationMethodName"] = obj["operationMethod"];
                        Global.Log.log("operationMethodName not found , value = %s", obj["operationMethod"]);
                    }
                }

                //新增自定义字段，是否显示备注
                if (typeof obj["bzShow"] != 'undefined') {
                    obj["isshowremark"] = obj["bzShow"] == "Y";
                } else {
                    obj["isshowremark"] = false;
                }

                if (i == (len - 1) && len > 1) {
                    total.push(obj);
                }
                else {
                    obj["stateColor"] = "";
                    if (obj["operationState"] == 1) obj["stateColor"] = "txt-negative";
                    if (obj["operationState"] == 4) obj["stateColor"] = "txt-positive";
                    content.push(obj);
                }

                if(obj["bankName"] === "支付宝"){
                    obj["isAlipay"] = true;
                }
            }

            this.content = content;
            this.total = total;
        }

        Global.Log.log("submitCallback content&total", this.content, this.total);

        this.submitSuccess();
    }

	/**
	 * 提交表单回调失败
	 * @param json
	 */
    submitError(json: ErrorInfoModel) {
        //解除防止重复提交限制
        this.isSubmitting = false;
        var text = (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate(this.messageNS, json.errorCode);
        Global.Tips.systemTip(text);
    }

	/**
	 * 查询结果返回成功
	 */
    submitSuccess() {
        //解除防止重复提交限制
        this.isSubmitting = false;

        this.showDataTable();
    }

    getAllFormData(): any {
        var d = {};

        for (var key in this.formInput) {
            d[key] = (<HTMLInputElement>this.formElement.find(this.formInput[key])[0]).value;
        }

        return d;
    }

    getOperateTypeItemByValue(value) {
        var i;

        this.ReportOperationType.forEach((item) => {
            if (item.value == value) {
                i = item;
                return false;
            }
        });

        return i;
    }

    getOperateStateItemByValue(value) {
        var i;

        this.ReportOperationState.forEach((item) => {
            if (item.value == value) {
                i = item;
                return false;
            }
        });

        return i;
    }

    getOperateMethodItemByValue(value) {
        var i;

        this.ReportOperationMethod.forEach((item) => {
            if (item.value == value) {
                i = item;
                return false;
            }
        });

        return i;
    }

	/**
	 * 显示记录表格
	 */
    showDataTable() {
        Global.Log.log("showDataTable");
        var hasContent = this.content ? this.content.length > 0 : false,
            contentTable = $(this.contentTable),
            stateTable = $(this.stateTable);

        if (hasContent) {
            this.setDataTable(contentTable, this.content, $(this.contentTpl).html());

            contentTable.removeClass("hide");
            stateTable.addClass("hide");
        }
        else {
            contentTable.addClass("hide");

            stateTable.removeClass("hide");//再次移除，防止没有移除
            stateTable.removeClass("loading");
            stateTable.addClass("no-record");
        }
    }

	/**
	 * 创建table
	 */
    setDataTable(target: JQuery, data, tpl) {
        var template = Handlebars.compile(tpl),
            html = template(data);

        target.html(html);
    }


    // 筛选面板显示
    FilterPannalShow() {
        $(this.FilterPannal).removeClass("hide");
    }
    //筛选面板隐藏
    FilterPannalHide() {
        $(this.FilterPannal).addClass("hide");
    }

    //对比输入开始结束的日期 
	// 开始日期大于结束返回false
	// 开始日期小于结束返回true
	checkDate(){
		// (<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "start_endTime_invalid")
		// Global.Tips.systemTip((<ILanguage>Com_Gametree_Cashap.Language).getMessage_Translate("", "start_endTime_invalid"));
		let startDate = new Date($(this.formInput.startDate).val());
		let endDate = new Date($(this.formInput.endDate).val());
		if(startDate <= endDate){
			return true;
		}
		else if(startDate > endDate){
			return false;
		}
	}
}

export = Report_Deposit;