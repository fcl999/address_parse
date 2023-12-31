# address_parse JavaScript 物流地址识别

基于 [smartParsePro](https://github.com/wzc570738205/smartParsePro) 修改

## 使用方式
    
```
import smart from 'address-parse'

/**
 * 
 * @type {{
 *  "zipCode":"710061", 
 *  "province":"陕西省",
 *  "provinceCode":"61",
 *  "city":"西安市",
 *  "cityCode":"6101",
 *  "county":"雁塔区",
 *  "countyCode":"610113",
 *  "street":"丈八沟街道",
 *  "streetCode":"610113007",
 *  "address":"高新四路高新大都荟",
 *  "name":"张三",
 *  "phone":"13344445555",
 *  "idCard":"211381198512096810"
 * }}
 */
const data = smart(text.value);
```

!!! 一般的用在用户输入/复制识别, 所以邮编未验证正确性,显著减打包文件大小;

## 支持的类型

- 王二，19999999999-7922，浙江省 绍兴市 柯桥区 柯岩街道 绍兴县柯桥柯岩大道越都名府城景园3区4幢5号 ，312030
- 牛三，86-19999999999，山东省 淄博市 周村区 北郊镇 大学城园区水晶城商业街京东电脑数码 ，250300
- 菜四，19999999999，广东省 汕头市 潮南区 陈店镇 西环路2号康美左边这栋楼10楼一定要打电话通知
- 收货人:刚刚,电话:哈哈,地址:北京市市辖区东城区 哈哈

类似最后一条的,带有关键字的可在 keys 中配置以忽略
