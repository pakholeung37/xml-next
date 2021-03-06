import { parse } from '@xml-tools/parser'
import { buildAst } from '@xml-tools/ast'
import { parse as nextParse } from '../index'
describe('benchmark', () => {
  it('should be faster', () => {
    let start = performance.now()
    for (let i = 0; i < 1; i++) {
      const { cst, tokenVector } = parse(xml)
      buildAst(cst as any, tokenVector)
    }

    let time1 = performance.now() - start
    console.log(time1)
    start = performance.now()
    for (let i = 0; i < 1; i++) {
      nextParse(xml)
    }
    let time2 = performance.now() - start

    console.log(time2)
    expect(time2).toBeLessThan(time1)
  })
})

const xml = `<View menuView="true"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" title="Inventory detail" type="List" forModel="inventory_InventoryLineBO" version="2" xsi:noNamespaceSchemaLocation="https://terminus-trantor.oss-cn-hangzhou.aliyuncs.com/xsi/0.18.x/base.xsd">
<Table key="table" model="inventory_InventoryLineBO" dataFlow="inventory_PagingInventoryLineBySearchFlow">
  <Search model="inventory_InventoryLineSO">
    <Fields>
      <Field name="createdAt" label="createdAt">
        <RenderType>
          <Date showTime="#{true}"/>
        </RenderType>
      </Field>
      <Field name="shopId" label="shopId">
        <RenderType>
          <NonRelatedModelSelect dataCondition="siteType = 'SHOP' and entity.id = ? and siteStatus='ENABLED'" dataParams="[@context.organization_OrganizationContext.getEntity.id]" modalTitle="shop information" model="md_SiteBO" fieldNames="{value: 'id', label: 'siteName'}"/>
        </RenderType>
      </Field>
      <Field name="warehouseId" label="warehouseId">
        <RenderType>
          <NonRelatedModelSelect dataCondition="#{}" dataParams="[@context.organization_OrganizationContext.getEntity.id]" modalTitle="Warehouse information" model="md_SiteBO" fieldNames="{value: 'id', label: 'siteName'}"/>
        </RenderType>
      </Field>
      <Field name="distributionCode" label="distributionCode"/>
      <Field name="distributionName" label="distributionName"/>
      <Field name="goodsCode" label="SkuCode"/>
      <Field name="goodsName" label="SkuName"/>
      <Field singleInSearch="#{true}" name="bizChangeTypeDict">
        <RenderType>
          <Select allowValues="#{() => ['INCREASE','DECREASE','COVE','OCCUPY','OCCUPY_RELEASE','FREEZE','UNFREEZE']}"/>
        </RenderType>
      </Field>
      <Field singleInSearch="#{true}" name="inventoryStoreStatusDict" label="inventoryStoreStatusDict"/>
      <Field singleInSearch="#{true}" name="bizCampaignType" label="bizCampaignType">
        <RenderType>
          <Select allowValues="#{() => ['CREATE_ORDER','PAY_ORDER','CLOSE_ORDER','MANUAL','CHANNEL_INVENTORY_PUSH','FREEZE_ADJUST','RESERVED']}"/>
        </RenderType>
      </Field>
      <Field name="bizOrderCode" label="bizOrderCode"/>
      <Field name="inventoryTypeDict" initValue="FRONT_INVENTORY" submit="#{true}" show="#{false}"/>
    </Fields>
  </Search>
  <Fields>
    <Field name="createdAt">
      <RenderType>
        <Date format="YYYY-MM-DD HH:mm:ss"/>
      </RenderType>
    </Field>
    <Field name="inventoryBO.shop.siteName" label="shop"/>
    <Field name="inventoryBO.warehouse.siteName" label="warehouse"/>
    <Field name="inventoryBO.distributionCode"/>
    <Field name="inventoryBO.distributionName"/>
    <Field name="inventoryBO.goodsCode" label="SkuCode"/>
    <Field name="inventoryBO.goodsName" label="SkuName"/>
    <Field name="bizChangeTypeDict" label="Type"/>
    <Field name="changeRecordQty"/>
    <Field name="inventoryStoreStatusView"/>
    <Field name="bizCampaignType"/>
    <Field name="bizOrderCode"/>
  </Fields>
</Table>
</View>`
