<template>
  <div class="echarts-examples">
    <div class="chart-tabs">
      <button v-for="chart in charts" :key="chart.type" :class="['tab-button', { active: activeChart === chart.type }]"
        @click="activeChart = chart.type">
        {{ chart.name }}
      </button>
    </div>

    <div class="chart-container">
      <div v-for="chart in charts" :key="chart.type" v-show="activeChart === chart.type"
        :ref="(el) => setChartRef(el, chart.type)" class="chart-item"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface ChartInstance {
  type: string;
  name: string;
  instance: echarts.ECharts | null;
  options: EChartsOption;
}

const activeChart = ref('scatter');
const chartRefs = ref<Record<string, HTMLDivElement | null>>({});

const charts = ref<ChartInstance[]>([
  {
    type: 'scatter',
    name: '散点图',
    instance: null,
    options: getScatterOptions(),
  },
  {
    type: 'line',
    name: '折线图',
    instance: null,
    options: getLineOptions(),
  },
  {
    type: 'bar',
    name: '柱状图',
    instance: null,
    options: getBarOptions(),
  },
  {
    type: 'heatmap',
    name: '热力图',
    instance: null,
    options: getHeatmapOptions(),
  },
  {
    type: 'polarHeatmap',
    name: '极坐标热力图',
    instance: null,
    options: getPolarHeatmapOptions(),
  },
  {
    type: 'candlestick',
    name: 'K线图',
    instance: null,
    options: getCandlestickOptions(),
  },
  {
    type: 'boxplot',
    name: '盒图',
    instance: null,
    options: getBoxplotOptions(),
  },
  {
    type: 'radar',
    name: '雷达图',
    instance: null,
    options: getRadarOptions(),
  },
  {
    type: 'pie',
    name: '饼图',
    instance: null,
    options: getPieOptions(),
  },
]);

// 散点图配置
function getScatterOptions(): EChartsOption {
  const data: number[][] = [];
  for (let i = 0; i < 200; i++) {
    data.push([
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 50,
    ]);
  }

  return {
    title: {
      text: '散点图示例',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `X: ${params.value[0]}<br/>Y: ${params.value[1]}<br/>大小: ${params.value[2]}`;
      },
    },
    xAxis: {
      type: 'value',
      name: 'X轴',
      nameLocation: 'middle',
      nameGap: 30,
    },
    yAxis: {
      type: 'value',
      name: 'Y轴',
      nameLocation: 'middle',
      nameGap: 50,
    },
    series: [
      {
        type: 'scatter',
        data: data,
        symbolSize: (data: number[]) => data[2],
        itemStyle: {
          color: '#5470c6',
          opacity: 0.6,
        },
      },
    ],
  };
}

// 折线图配置
function getLineOptions(): EChartsOption {
  const dates: string[] = [];
  const values1: number[] = [];
  const values2: number[] = [];
  const values3: number[] = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(2024, 0, i + 1);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
    values1.push(Math.random() * 100 + 50);
    values2.push(Math.random() * 100 + 30);
    values3.push(Math.random() * 100 + 70);
  }

  return {
    title: {
      text: '折线图示例',
      left: 'center',
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['系列1', '系列2', '系列3'],
      top: 35,
    },
    grid: {
      left: 60,
      right: 40,
      top: 80,
      bottom: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: {
      type: 'value',
      name: '数值',
    },
    series: [
      {
        name: '系列1',
        type: 'line',
        data: values1,
        smooth: true,
        itemStyle: { color: '#5470c6' },
        areaStyle: {
          opacity: 0.3,
        },
      },
      {
        name: '系列2',
        type: 'line',
        data: values2,
        smooth: true,
        itemStyle: { color: '#91cc75' },
        areaStyle: {
          opacity: 0.3,
        },
      },
      {
        name: '系列3',
        type: 'line',
        data: values3,
        smooth: true,
        itemStyle: { color: '#fac858' },
        areaStyle: {
          opacity: 0.3,
        },
      },
    ],
  };
}

// 柱状图配置
function getBarOptions(): EChartsOption {
  const categories = ['一月', '二月', '三月', '四月', '五月', '六月'];
  const data1 = [120, 200, 150, 80, 70, 110];
  const data2 = [220, 182, 191, 234, 290, 330];
  const data3 = [150, 232, 201, 154, 190, 330];

  return {
    title: {
      text: '柱状图示例',
      left: 'center',
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['系列1', '系列2', '系列3'],
      top: 35,
    },
    grid: {
      left: 60,
      right: 40,
      top: 80,
      bottom: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
    },
    yAxis: {
      type: 'value',
      name: '数值',
    },
    series: [
      {
        name: '系列1',
        type: 'bar',
        data: data1,
        itemStyle: { color: '#5470c6' },
      },
      {
        name: '系列2',
        type: 'bar',
        data: data2,
        itemStyle: { color: '#91cc75' },
      },
      {
        name: '系列3',
        type: 'bar',
        data: data3,
        itemStyle: { color: '#fac858' },
      },
    ],
  };
}

// 热力图配置
function getHeatmapOptions(): EChartsOption {
  const hours = [
    '12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
    '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p',
  ];
  const days = ['周六', '周五', '周四', '周三', '周二', '周一', '周日'];

  const data: number[][] = [];
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 24; j++) {
      data.push([j, i, Math.floor(Math.random() * 100)]);
    }
  }

  // 确保数据格式正确：[x, y, value]
  // x 对应 hours 的索引，y 对应 days 的索引

  return {
    title: {
      text: '热力图示例',
      left: 'center',
      top: 10,
    },
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${days[params.value[1]]} ${hours[params.value[0]]}<br/>数值: ${params.value[2]}`;
      },
    },
    grid: {
      height: 300,
      top: 80,
      left: 80,
      right: 80,
      bottom: 100,
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true,
      },
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true,
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 20,
      itemWidth: 20,
      itemHeight: 140,
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      },
    },
    series: [
      {
        name: '热力图',
        type: 'heatmap',
        data: data,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
}

// 极坐标热力图配置
function getPolarHeatmapOptions(): EChartsOption {
  // 生成24小时 x 7天的数据
  const hours = 24;
  const days = 7;
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  // 生成数据：为每个扇形区域生成密集的点，形成连续的色块
  const data: number[][] = [];

  for (let hourIndex = 0; hourIndex < 24; hourIndex++) {
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // 为每个扇形区域生成多个点，填充整个区域
      const value = Math.floor(Math.random() * 100);
        data.push([dayIndex, hourIndex, value]);
      
    }
  }
  const maxValue = data.reduce(function (max, item) {
    return Math.max(max, item[2]);
  }, -Infinity);
  return {
    title: {
      text: '极坐标热力图示例',
      left: 'center',
      top: 10,
    },
      legend: {
        data: ['Punch Card']
      },
      polar: {},
      tooltip: {},
      visualMap: {
        type: 'continuous',
        min: 0,
        max: maxValue,
        top: 'middle',
        dimension: 2,
        calculable: true
      },
      angleAxis: {
        type: 'category',
        data: hourLabels,
        boundaryGap: false,
        splitLine: {
          show: true,
          lineStyle: {
            color: '#ddd',
            type: 'dashed'
          }
        },
        axisLine: {
          show: false
        }
      },
      radiusAxis: {
        type: 'category',
        data: dayNames,
        z: 100
      },
      series: [
        {
          name: 'Punch Card',
          type: 'custom',
          coordinateSystem: 'polar',
          renderItem: function (params, api) {
            var values = [api.value(0), api.value(1)];
            var coord = api.coord(values);
            var size = api.size!([1, 1], values) as number[];
            return {
              type: 'sector',
              shape: {
                cx: (params.coordSys as any).cx,
                cy: (params.coordSys as any).cy,
                r0: coord[2] - size[0] / 2,
                r: coord[2] + size[0] / 2,
                startAngle: -(coord[3] + size[1] / 2),
                endAngle: -(coord[3] - size[1] / 2)
              },
              style: api.style({
                fill: api.visual('color')
              })
            };
          },
          data: data
        }
      ]
    };
  };

// K线图配置
function getCandlestickOptions(): EChartsOption {
  const dates: string[] = [];
  const data: number[][] = [];

  for (let i = 0; i < 20; i++) {
    const date = new Date(2024, 0, i + 1);
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`);

    const open = Math.random() * 100 + 50;
    const close = open + (Math.random() - 0.5) * 20;
    const low = Math.min(open, close) - Math.random() * 10;
    const high = Math.max(open, close) + Math.random() * 10;

    data.push([open, close, low, high]);
  }

  return {
    title: {
      text: 'K线图示例',
      left: 'center',
      top: 10,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        const data = params[0].value;
        return `日期: ${params[0].name}<br/>
                开盘: ${data[0]}<br/>
                收盘: ${data[1]}<br/>
                最低: ${data[2]}<br/>
                最高: ${data[3]}`;
      },
    },
    grid: {
      left: 60,
      right: 60,
      top: 60,
      bottom: 80,
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true,
      },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 50,
        end: 100,
      },
      {
        show: true,
        type: 'slider',
        bottom: 10,
        start: 50,
        end: 100,
        height: 20,
      },
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: data,
        itemStyle: {
          color: '#ec0000',
          color0: '#00da3c',
          borderColor: '#8A0000',
          borderColor0: '#008F28',
        },
      },
    ],
  };
}

// 盒图（箱线图）配置
function getBoxplotOptions(): EChartsOption {
  const categories = ['类别1', '类别2', '类别3', '类别4', '类别5'];
  const data: number[][] = [];

  categories.forEach(() => {
    const values: number[] = [];
    for (let i = 0; i < 100; i++) {
      values.push(Math.random() * 100);
    }
    values.sort((a, b) => a - b);

    const q1 = values[25];
    const median = values[50];
    const q3 = values[75];
    const min = values[0];
    const max = values[99];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;

    data.push([min, q1, median, q3, max, mean]);
  });

  return {
    title: {
      text: '盒图（箱线图）示例',
      left: 'center',
      top: 10,
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.value;
        return `${params.name}<br/>
                最小值: ${data[0]}<br/>
                下四分位数: ${data[1]}<br/>
                中位数: ${data[2]}<br/>
                上四分位数: ${data[3]}<br/>
                最大值: ${data[4]}<br/>
                平均值: ${data[5]}`;
      },
    },
    grid: {
      left: 60,
      right: 60,
      top: 60,
      bottom: 60,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: true,
      nameGap: 30,
      splitArea: {
        show: false,
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: '数值',
      splitArea: {
        show: true,
      },
    },
    series: [
      {
        name: '盒图',
        type: 'boxplot',
        data: data,
        itemStyle: {
          color: '#b8e994',
          borderColor: '#6c5ce7',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
}

// 雷达图配置
function getRadarOptions(): EChartsOption {
  const indicators = [
    { name: '销售', max: 100 },
    { name: '管理', max: 100 },
    { name: '信息技术', max: 100 },
    { name: '客服', max: 100 },
    { name: '研发', max: 100 },
    { name: '市场', max: 100 },
  ];

  const data1 = [80, 90, 70, 85, 95, 75];
  const data2 = [60, 70, 80, 65, 75, 85];
  const data3 = [90, 75, 85, 90, 80, 70];

  return {
    title: {
      text: '雷达图示例',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      data: ['团队A', '团队B', '团队C'],
      top: 30,
    },
    radar: {
      indicator: indicators,
      center: ['50%', '55%'],
      radius: '70%',
      splitArea: {
        areaStyle: {
          color: ['rgba(250, 250, 250, 0.3)', 'rgba(200, 200, 200, 0.3)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(200, 200, 200, 0.5)',
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(200, 200, 200, 0.5)',
        },
      },
    },
    series: [
      {
        name: '团队A',
        type: 'radar',
        data: [
          {
            value: data1,
            name: '团队A',
            itemStyle: { color: '#5470c6' },
            areaStyle: { opacity: 0.3 },
          },
        ],
      },
      {
        name: '团队B',
        type: 'radar',
        data: [
          {
            value: data2,
            name: '团队B',
            itemStyle: { color: '#91cc75' },
            areaStyle: { opacity: 0.3 },
          },
        ],
      },
      {
        name: '团队C',
        type: 'radar',
        data: [
          {
            value: data3,
            name: '团队C',
            itemStyle: { color: '#fac858' },
            areaStyle: { opacity: 0.3 },
          },
        ],
      },
    ],
  };
}

// 饼图配置
function getPieOptions(): EChartsOption {
  const data = [
    { value: 1048, name: '搜索引擎' },
    { value: 735, name: '直接访问' },
    { value: 580, name: '邮件营销' },
    { value: 484, name: '联盟广告' },
    { value: 300, name: '视频广告' },
  ];

  return {
    title: {
      text: '饼图示例',
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [
      {
        name: '访问来源',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
        },
        data: data,
      },
    ],
  };
}

const setChartRef = (el: any, type: string) => {
  if (el) {
    chartRefs.value[type] = el as HTMLDivElement;
  }
};

const initCharts = async () => {
  await nextTick();
  // 等待 DOM 完全渲染
  await new Promise(resolve => setTimeout(resolve, 100));

  charts.value.forEach((chart) => {
    const container = chartRefs.value[chart.type];
    if (container && !chart.instance) {
      // 确保容器有尺寸
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        // 检查容器是否已经被其他实例占用
        const existingInstance = echarts.getInstanceByDom(container);
        if (existingInstance) {
          echarts.dispose(existingInstance);
        }
        chart.instance = echarts.init(container);
        chart.instance.setOption(chart.options);
      }
    }
  });
};

const resizeCharts = () => {
  charts.value.forEach((chart) => {
    if (chart.instance) {
      chart.instance.resize();
    }
  });
};

const updateActiveChart = async () => {
  await nextTick();
  // 等待 DOM 完全渲染和显示
  await new Promise(resolve => setTimeout(resolve, 100));

  const chart = charts.value.find((c) => c.type === activeChart.value);
  if (chart) {
    const container = chartRefs.value[chart.type];
    if (container) {
      // 确保容器有尺寸
      const checkSize = () => {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
          if (!chart.instance) {
            // 检查容器是否已经被其他实例占用
            const existingInstance = echarts.getInstanceByDom(container);
            if (existingInstance) {
              echarts.dispose(existingInstance);
            }
            chart.instance = echarts.init(container);
            chart.instance.setOption(chart.options);
          } else {
            // 检查实例是否仍然有效
            try {
              chart.instance.resize();
              chart.instance.setOption(chart.options, { notMerge: false });
            } catch (e) {
              // 如果实例无效，重新初始化
              console.warn('Chart instance invalid, reinitializing:', e);
              if (chart.instance) {
                chart.instance.dispose();
              }
              chart.instance = echarts.init(container);
              chart.instance.setOption(chart.options);
            }
          }
          return true;
        }
        return false;
      };

      if (!checkSize()) {
        // 如果容器还没有尺寸，等待一下再试
        setTimeout(() => {
          checkSize();
        }, 200);
      }
    }
  }
};

onMounted(() => {
  initCharts();
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  charts.value.forEach((chart) => {
    if (chart.instance) {
      chart.instance.dispose();
    }
  });
  window.removeEventListener('resize', resizeCharts);
});

// 监听 activeChart 变化
watch(activeChart, () => {
  updateActiveChart();
});
</script>

<style scoped>
.echarts-examples {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.chart-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  padding: 8px 16px;
  border: 1px solid #d0d0d0;
  background: #fff;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tab-button:hover {
  background: #f5f5f5;
  border-color: #999;
}

.tab-button.active {
  background: #5470c6;
  color: #fff;
  border-color: #5470c6;
}

.chart-container {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.chart-item {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
