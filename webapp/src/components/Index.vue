<template>
  <section>
    <mu-appbar title="成绩查询助手" titleClass="navbar">
      <mu-flat-button label="点我查询" slot="right" secondary @click="search" />
    </mu-appbar>
    <mu-sub-header>输入信息</mu-sub-header>
    <div style="padding-left:20px;padding-right:20px">
      <mu-text-field label="考号" labelFloat fullWidth v-model="idcard" /><br/>
      <mu-text-field label="姓名" labelFloat fullWidth v-model="name" />
    </div>
    <div class="sheets">
      <!-- <mu-refresh-control :refreshing="refreshing" :trigger="trigger" @refresh="refresh"/> -->
      <mu-list ref="muList">
        <mu-sub-header>选择成绩库</mu-sub-header>
        <div v-if="initing" class="loading">
          <mu-linear-progress/>
          <p>正在加载 长时间无响应请刷新页面</p>
        </div>
        <template v-for="(item,index) in list">
                    <mu-list-item disableRipple @click="handleToggle(item.val)"  :title="item.name" :key="index">
                      <mu-radio v-model="sheetName" slot="left" name="group" :nativeValue="item.val"/>
                    </mu-list-item>
</template>
    </mu-list>
    <mu-infinite-scroll :scroller="scroller" :loading="loading" @load="loadMore"/>
    <mu-popup position="top" :overlay="true" popupClass="my-popup-top" :open="topPopup">
     {{popMessage}}
    </mu-popup>
    <mu-dialog :open="dialog" title="提示">
         {{dialogMessage}}
      <mu-flat-button label="确定" slot="actions" primary @click="close"/>
    </mu-dialog>
  </div>
     
</section>

</template>

<script>
  export default {
    name: "app",
    data() {
      return {
        initing: false,
        dialog: false,
        dialogMessage: "",
        idcard: "",
        name: "",
        sheetList: [],
        list: [],
        sheetName: "",
        popMessage: "",
        topPopup: false,
        num: 0,
        loading: false,
        scroller: null
      };
    },
    watch: {
      topPopup(val) {
        if (val) {
          setTimeout(() => {
            this.topPopup = false;
          }, 2000);
        }
      }
    },
    methods: {
      open(message) {
        this.dialog = true;
        this.dialogMessage = message;
      },
      close() {
        this.dialog = false;
      },
      loadMore() {
        this.loading = true;
        setTimeout(() => {
          const list = this.sheetList.slice(0, this.num + 10);
          this.list = list;
          this.num += 10;
          this.loading = false;
        }, 200);
      },
      handleToggle(key) {
        this.sheetName = key;
      },
      pop(msg) {
        this.topPopup = true;
        this.popMessage = msg;
      },
      getSheetList() {
        this.initing = true;
        this.$http
          .get(this.$api.getSheet)
          .then(resp => {
            this.initing = false;
            if (resp.data.status === 200) {
              this.sheetList = resp.data.rows;
            } else {
              this.pop(resp.data.message);
            }
          })
          .then(() => {
            this.list = this.sheetList.slice(0, 10);
            this.num += 10;
          });
      },
      /***
       * @augments
       *
       */
      search() {
        // this.open("功能还在开发中哟");
        const query = {
          num: this.idcard,
          name: this.name,
          sheet: this.sheetName
        };
        this.$router.push({
          name: 'Result',
          query
        });
        return;
      }
    },
    mounted() {
      console.log(this.$refs);
      this.scroller = this.$refs.muList.$el;
      this.getSheetList();
    }
  };
</script>
<style lang="scss" scoped>
  .loading {
    padding-top: 20px;
    padding-left: 20px;
    padding-right: 20px;
    p {
      text-align: center;
      font-size: 16px;
    }
  }
</style>

<style lang="scss">
  .sheets {
    position: relative;
  }
  .navbar {}
  .my-popup-top {
    width: 100%;
    opacity: 0.8;
    height: 48px;
    line-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 375px;
  }
</style>
