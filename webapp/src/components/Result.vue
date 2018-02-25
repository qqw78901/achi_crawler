<template>
  <div>
    <mu-appbar title="查询结果" titleClass="navbar">
      <mu-flat-button label="返回" slot="left" secondary @click="back" />
    </mu-appbar>
    <div class="ld" v-if="loading">
      <mu-circular-progress :size="90" color="red" />
      <p>爬取数据中请稍候...</p>
    </div>
    <template v-if="!loading">
        <mu-sub-header>成绩单（已隐藏无分数的项目）</mu-sub-header>
        <mu-table :showCheckbox='false'>
          <mu-tbody>
            <mu-tr v-for="(key,index) in resultKey" :key='index' v-if="parseInt(resultVal[index],10)!==0">
              <mu-td class="th">{{key}}</mu-td>
              <mu-td class="td">{{resultVal[index]}}</mu-td>
            </mu-tr>
          </mu-tbody>
        </mu-table>
</template>
  </div>
</template>
<script>
export default {
  name: "Result",
  data() {
    return {
      loading: true,
      resultKey: [],
      resultVal: []
    };
  },
  methods: {
    back() {
      this.$router.push("/");
    }
  },
  mounted() {
    console.log(this.$route);
    const { query } = this.$route;
    if (query.num) {
      // debugger;
      this.$http
        .get(this.$api.getAchievement, {
          params: query
        })
        .then(resp => {
          console.log(resp);
          if (resp.data.status == 200 && resp.data.rows) {
            this.resultVal = resp.data.rows.resultVal;
            this.resultKey = resp.data.rows.resultKey;
            this.loading = false;
          } else {
            alert("查询失败");
          }
        });
    } else {
      this.$router.push("/");
    }
  }
};
</script>
<style lang="scss" scoped>
.th {
  font-weight: bold;
  text-align: center;
}
.td {
  text-align: center;
}
.ld {
  text-align: center;
  padding: 20px;
}
</style>

