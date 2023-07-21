import pcasCode from './pcasCode.js'
// 地址分组
const provinceList = [];
const cityList = [];
const countyList = [];
pcasCode.forEach((item) => {
  formatAddressList(item, 1, null);
});

/**
 * 地址数据分组处理
 * @param item-各级数据对象
 * @param index-对应的省/市/县区/街道
 * @param parent - 父级
 * @returns {viod}
 */
function formatAddressList(item, index, parent) {
  item.parent = parent;
  if (index === 1) {
    //省
    provinceList.push(item);
    item.type = "province";
  }
  if (index === 2) {
    //市
    cityList.push(item);
    item.type = "city";
  }
  if (index === 3) {
    //区或者县
    countyList.push(item);
    item.type = "county";
  }
  if (index === 4) {
    //街道
    item.type = "street";
  }
  if (item.children) {
    index++;
    item.children.forEach((res) => {
      formatAddressList(res, index, item);
    });
  }
}

/**
 * 地址识别
 * @param str {string}识别的地址
 * @param options {{other: bool}|undefined} 匹配配置项 
 * @returns <obj>
 */
export function smart(str, options) {
  const result = {};
  let other = '';
  const textArr = stripscript(str).split(" ");
  textArr.forEach((text, _index) => {
    // 一个字的文本 不识别
    if (text.length <= 1) {
      other += text;
      return;
    }
    let addressObj = smartAddress(text, result);
    if (JSON.stringify(addressObj) === "{}") {
      if (!result.name) {
        result.name = text;
      } else {
        other += text;
      }
    }
    Object.assign(result, addressObj);
  });
  result.other = other;
  if (other && options?.other) {
    result.address = (result.address || '') + other + ' ';
  }
  return result;
}
/**
 * 获得1个地址数据
 * @param {Array} matchList 匹配的地址数据列表
 * @returns {item| null} 一个地址数据
 */
function getOneMatch(matchList) {
  if (!matchList.length) {
    return null;
  }
  return matchList.sort((a, b) => b.matchValue.length - a.matchValue.length)[0];
}
/**
 * 匹配文本类型
 * @param text {string} 字符串
 * @param result {Object} 存储着一匹配成功的值
 * @returns {Object}
 */
function smartAddress(text, result) {


  //身份证号匹配
  if (IdentityCodeValid(text)) {
    return { idCard: text };
  }

  //电话匹配
  let phone = text.match(
    /(86)?1(\d){10}(-(\d){4})?/g
  );
  if (phone) {
    return { phone: phone[0] };
  }

  //邮编匹配
  let zipCode = text.match(/^\d{6}$/g);
  if (zipCode) {
    return { zipCode: zipCode };
  }

  // 地址匹配
  let data = {};
  let matchAddress = {

  }
  //省匹配
  if (!result.provinceCode) {
    const matchProvince = []; //粗略匹配上的省份
    for (let endIndex = 0; endIndex < text.length; endIndex++) {
      const province = text.slice(0, endIndex + 2); // 北  北京  北京市 北京市朝
      provinceList.forEach(item => {
        if (item.name.indexOf(province) !== -1) {
          matchProvince.push({
            name: item.name,
            code: item.code,
            matchValue: province,
            value: item
          });
        }
      });
    }

    //统计筛选初略统计出的省份
    const province = getOneMatch(matchProvince);
    if (province) {
      data.province = province.name;
      data.provinceCode = province.code;
      text = text.replace(province.matchValue, "");
      matchAddress.province = province.value;
    }
  } else {
    matchAddress.province = provinceList.find(province => province.code === result.provinceCode);
  }
  //市查找
  if (!result.cityCode) {
    // 如果 已经匹配到省
    if (data.provinceCode || result.provinceCode ) {
      // 并且是直辖市
      if (matchAddress.province.children[0].name === "市辖区") {
          data.city = matchAddress.province.children[0].name;
          data.cityCode = matchAddress.province.children[0].code;
          text = text.replace("市辖区", "");
          matchAddress.city = matchAddress.province.children[0];
      } else {
        const matchCity = []; //粗略匹配上的市
        for (let endIndex = 0; endIndex < text.length; endIndex++) {
          const city = text.slice(0, endIndex + 2);
          matchAddress.province.children.forEach(item => {
            if (item.name.indexOf(city) !== -1) {
              matchCity.push({
                name: item.name,
                code: item.code,
                matchValue: city,
                value: item,
              });
            }
          });
        }
        //统计筛选初略统计出的市
        const city = getOneMatch(matchCity);
        if (city) {
          data.city = city.name;
          data.cityCode = city.code;
          text = text.replace(city.matchValue, "");
          matchAddress.city = city.value;
        }
      }
    } else {
      const matchCity = []; //粗略匹配上的市
      for (let endIndex = 0; endIndex < text.length; endIndex++) {
        const city = text.slice(0, endIndex + 2);
        cityList.forEach(item => {
          if (item.name.indexOf(city) !== -1) {
            matchCity.push({
              name: item.name,
              code: item.code,
              matchValue: city,
              value: item,
            });
          }
        });
      }
      //统计筛选初略统计出的市
      const city = getOneMatch(matchCity);
      if (city) {
        data.city = city.name;
        data.cityCode = city.code;
        text = text.replace(city.matchValue, "");
        matchAddress.city = city.value;
        if (!result.provinceCode) { // 未匹配的省份、直辖市
          matchAddress.province = city.value.parent;
          data.provinceCode = matchAddress.province.code;
          data.province = matchAddress.province.name;
        }
      }
    }
  } else {
    matchAddress.city = matchAddress.province.children.find(city => city.code === result.cityCode);
  }

  //区县查找
  if (!result.countyCode) {
    // 如果 已经匹配到市
    if (data.cityCode || result.cityCode ) {
      const matchCounty = []; //粗略匹配上的区县
      for (let endIndex = 0; endIndex < text.length; endIndex++) {
        const county = text.slice(0, endIndex + 2);
        matchAddress.city.children.forEach(item => {
          if (item.name.indexOf(county) !== -1) {
            matchCounty.push({
              name: item.name,
              code: item.code,
              matchValue: county,
              value: item,
            });
          }
        });
      }
      //统计筛选初略统计出的市
      const county = getOneMatch(matchCounty);
      if (county) {
        data.county = county.name;
        data.countyCode = county.code;
        text = text.replace(county.matchValue, "");
      }
    } else {
      const matchCounty = []; //粗略匹配上的市
      for (let endIndex = 0; endIndex < text.length; endIndex++) {
        const county = text.slice(0, endIndex + 2);
        countyList.forEach(item => {
          if (item.name.indexOf(county) !== -1) {
            matchCounty.push({
              name: item.name,
              code: item.code,
              matchValue: county,
              value: item,
            });
          }
        });
      }
      //统计筛选初略统计出的市
      const county = getOneMatch(matchCounty);
      if (county) {
        data.county = county.name;
        data.countyCode = county.code;
        text = text.replace(county.matchValue, "");
        if (!result.cityCode) { // 未匹配到市
          matchAddress.city = county.value.parent;
          data.cityCode = matchAddress.city.code;
          data.city = matchAddress.city.name;
        }
        if (!result.provinceCode) { // 未匹配的省份、直辖市
          matchAddress.province = county.value.parent.parent;
          data.provinceCode = matchAddress.province.code;
          data.province = matchAddress.province.name;
        }
      }
    }
  } else {
    matchAddress.city = matchAddress.province.children.find(city => city.code === result.cityCode);
  }

  //详细地址
  if (data.province) {
    data.address = (data.address || '') + text;
  }

  return data;
}

/**
 * 替换特殊字符 为 " ";
 * @param s {string} 文本
 * @returns {string}
 */
function stripscript(s) {
  s = s.replace(/(\d{3})-(\d{4})-(\d{4})-(\d{5})/g, "$1$2$3-$4");
  s = s.replace(/(\d{3})-(\d{4})-(\d{4})/g, "$1$2$3");
  s = s.replace(/(\d{3}) (\d{4}) (\d{4})/g, "$1$2$3");
  s = s.replace(/[`~!@#$^&*()=|{}':;,\[\].<>/?！￥…（）—【】‘；：”“’。，、？]/g, " ")
  const keys = [
    '收货人',
    '电话',
    '地址',
    '姓名',
    '联系电话',
  ]
  keys.forEach(key => s = s.replaceAll(key, " "))
  s = s.replace(/[\r\n]/g, "");
  return s;
}

function IdentityCodeValid(code) {
  let pass;
  let city = {
    11: "北京",
    12: "天津",
    13: "河北",
    14: "山西",
    15: "内蒙古",
    21: "辽宁",
    22: "吉林",
    23: "黑龙江 ",
    31: "上海",
    32: "江苏",
    33: "浙江",
    34: "安徽",
    35: "福建",
    36: "江西",
    37: "山东",
    41: "河南",
    42: "湖北 ",
    43: "湖南",
    44: "广东",
    45: "广西",
    46: "海南",
    50: "重庆",
    51: "四川",
    52: "贵州",
    53: "云南",
    54: "西藏 ",
    61: "陕西",
    62: "甘肃",
    63: "青海",
    64: "宁夏",
    65: "新疆",
    71: "台湾",
    81: "香港",
    82: "澳门",
    91: "国外 ",
  };
  let _tip = "";
  pass = true;

  if (!code || !/^\d{17}(\d|X)$/i.test(code)) {
    _tip = "身份证号格式错误";
    pass = false;
  } else if (!city[code.substr(0, 2)]) {
    _tip = "地址编码错误";
    pass = false;
  } else {
    //18位身份证需要验证最后一位校验位
    if (code.length === 18) {
      code = code.split("");
      //∑(ai×Wi)(mod 11)
      //加权因子
      let factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      //校验位
      let parity = [1, 0, "X", 9, 8, 7, 6, 5, 4, 3, 2];
      let sum = 0;
      let ai = 0;
      let wi = 0;
      for (let i = 0; i < 17; i++) {
        ai = code[i];
        wi = factor[i];
        sum += ai * wi;
      }
      // let last = parity[sum % 11];
      if (parity[sum % 11] !== code[17]) {
        _tip = "校验位错误";
        pass = false;
      }
    }
  }
  console.log(_tip)
  return pass;
}

export default smart;