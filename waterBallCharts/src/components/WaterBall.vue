<template>
  <div id="myChart" :style="{width: '100%', height: '400px'}"></div>
</template>

<script>
// require('echarts-liquidfill')
export default {
  name: 'WaterBall',
  data () {
    return {
      msg: 'hello,echarts!'
    }
  },
  mounted () {
    this.drawChart()
  },
  methods: {
    drawChart () {
      let shapeArr = ['path://M789,594h-32.2L744,560.7h-58.7L673.2,594h-31.4l57.2-146.7h31.3L789,594z M734.5,536l-20.2-54.5L694.4,536H734.5z', 'path://M879.8,447.3h58.7c11.6,0,20.3,0.5,26,1.5c5.7,1,10.8,3,15.3,6.1c4.5,3.1,8.3,7.2,11.3,12.3c3,5.1,4.5,10.8,4.5,17.2c0,6.9-1.9,13.2-5.6,18.9c-3.7,5.7-8.7,10-15.1,12.9c8.9,2.6,15.8,7,20.6,13.3c4.8,6.3,7.2,13.6,7.2,22.1c0,6.7-1.6,13.2-4.7,19.5c-3.1,6.3-7.3,11.3-12.7,15.1c-5.4,3.8-12,6.1-19.9,7c-4.9,0.5-16.9,0.9-35.7,1h-49.9V447.3z M909.4,471.7v33.9h19.4c11.5,0,18.7-0.2,21.5-0.5c5.1-0.6,9.1-2.4,12-5.3c2.9-2.9,4.4-6.7,4.4-11.5c0-4.5-1.3-8.2-3.8-11.1c-2.5-2.8-6.2-4.6-11.2-5.2c-2.9-0.3-11.4-0.5-25.3-0.5H909.4z M909.4,530.1v39.2h27.4c10.7,0,17.4-0.3,20.3-0.9c4.4-0.8,8-2.8,10.8-5.9c2.8-3.1,4.2-7.3,4.2-12.5c0-4.4-1.1-8.1-3.2-11.2c-2.1-3.1-5.2-5.3-9.3-6.7c-4-1.4-12.8-2.1-26.3-2.1H909.4z', 'path://M1198.6,540.1l28.7,9.1c-4.4,16-11.7,27.9-22,35.7c-10.2,7.8-23.2,11.7-39,11.7c-19.5,0-35.5-6.7-48-20c-12.5-13.3-18.8-31.5-18.8-54.6c0-24.4,6.3-43.4,18.9-56.9c12.6-13.5,29.2-20.3,49.7-20.3c17.9,0,32.5,5.3,43.7,15.9c6.7,6.3,11.7,15.3,15,27l-29.3,7c-1.7-7.6-5.4-13.6-10.9-18c-5.5-4.4-12.2-6.6-20.1-6.6c-10.9,0-19.7,3.9-26.5,11.7c-6.8,7.8-10.2,20.5-10.2,37.9c0,18.6,3.3,31.8,10,39.6c6.7,7.9,15.3,11.8,26,11.8c7.9,0,14.6-2.5,20.3-7.5C1192,558.7,1196.1,550.8,1198.6,540.1z', 'path://M1345.6,447.3h54.2c12.2,0,21.5,0.9,27.9,2.8c8.6,2.5,16,7,22.1,13.5c6.1,6.5,10.8,14.4,14,23.8c3.2,9.4,4.8,20.9,4.8,34.7c0,12.1-1.5,22.5-4.5,31.2c-3.7,10.7-8.9,19.3-15.7,25.9c-5.1,5-12.1,8.9-20.8,11.7c-6.5,2.1-15.3,3.1-26.2,3.1h-55.8V447.3z M1375.2,472.1v97.2h22.1c8.3,0,14.2-0.5,17.9-1.4c4.8-1.2,8.8-3.2,12-6.1c3.2-2.9,5.8-7.6,7.8-14.2c2-6.6,3-15.5,3-26.9c0-11.3-1-20.1-3-26.1c-2-6.1-4.8-10.8-8.4-14.2s-8.2-5.7-13.7-6.9c-4.1-0.9-12.2-1.4-24.3-1.4H1375.2z'] // A,B,C,D
      // console.log(this.$echarts)
      let myChart = this.$echarts.init(document.getElementById('myChart'))
      let optionA = {
        series: [{
          type: 'liquidFill',
          data: [1.1],
          color: ['blue'],
          radius: '60%',
          waveLength: '90%',
          waveHeight: '10',
          amplitude: 6,
          outline: {
            show: false
          },
          backgroundStyle: {
            borderColor: 'pink',
            borderWidth: 0,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            shadowBlur: 20
          },
          shape: shapeArr[0],
          label: {
            normal: {
              position: ['50%', '-50%'],
              formatter: function () {
                return '' // 图上显示的返回值
              }
            }
          }
        }]
      }
      let optionB = {
        series: [{
          type: 'liquidFill',
          data: [0.6, 0.5, 0.4, 0.3]
        }]
      }
      // run at: http://gallery.echartsjs.com/editor.html?c=xry0tUfcBe
      let optionC = {
        series: [{
          type: 'liquidFill',
          data: [0.6, 0.5, 0.4, 0.3],
          radius: '40%',
          shape: 'diamond',
          center: ['25%', '25%']
        }, {
          type: 'liquidFill',
          data: [0.6, 0.5, 0.4, 0.3],
          direction: 'left',
          radius: '40%',
          shape: 'rect',
          center: ['75%', '25%']
        }, {
          type: 'liquidFill',
          data: [0.6, 0.5, 0.4, 0.3],
          radius: '40%',
          shape: 'roundRect',
          center: ['25%', '75%'],
          backgroundStyle: {
            borderColor: '#156ACF',
            borderWidth: 1,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            shadowBlur: 20
          },
          outline: {
            show: false
          },
          waveAnimation: false // 禁止左右波动
        }, {
          type: 'liquidFill',
          data: [0.6, 0.5, 0.4, 0.3],
          radius: '50%',
          shape: 'pin',
          center: ['75%', '75%'],
          amplitude: 0,
          waveAnimation: false,
          outline: {
            show: false
          },
          backgroundStyle: {
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            shadowBlur: 20
          }
        }]
      }
      console.log(optionA)
      console.log(optionB)
      myChart.setOption(optionC)
    }
  }
}
</script>

<style scoped>
  #myChart{
    /*margin-left: -20px;*/
  }
</style>
