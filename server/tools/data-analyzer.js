module.exports = {
  name: 'data_analyzer',
  description: 'Analyze datasets to find patterns, generate statistics, summarize data, filter records, and produce insights. Accepts JSON array data.',
  category: 'analytics',
  icon: '📊',
  parameters: {
    type: 'object',
    properties: {
      data: { type: 'array', description: 'Array of data objects to analyze' },
      operation: {
        type: 'string',
        enum: ['summarize', 'filter', 'aggregate', 'trend', 'top_n'],
        description: 'Analysis operation to perform'
      },
      field: { type: 'string', description: 'The field/column to analyze' },
      condition: { type: 'object', description: 'Filter condition (for filter operation)' },
      limit: { type: 'number', description: 'Limit results (for top_n)', default: 5 }
    },
    required: ['data', 'operation']
  },

  async execute(params) {
    const { data, operation, field, condition, limit = 5 } = params;

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'Data must be a non-empty array' };
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    try {
      switch (operation) {
        case 'summarize': {
          const columns = Object.keys(data[0]);
          const summary = {
            totalRecords: data.length,
            columns,
            columnCount: columns.length,
            sampleRecord: data[0],
            columnStats: {}
          };

          for (const col of columns) {
            const values = data.map(r => r[col]).filter(v => v !== null && v !== undefined);
            const numericValues = values.filter(v => typeof v === 'number');

            if (numericValues.length > 0) {
              summary.columnStats[col] = {
                type: 'numeric',
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                avg: +(numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2),
                sum: +numericValues.reduce((a, b) => a + b, 0).toFixed(2),
                nullCount: data.length - values.length
              };
            } else {
              const uniqueValues = [...new Set(values.map(String))];
              summary.columnStats[col] = {
                type: 'categorical',
                uniqueCount: uniqueValues.length,
                topValues: uniqueValues.slice(0, 5),
                nullCount: data.length - values.length
              };
            }
          }

          return { success: true, operation: 'summarize', result: summary };
        }

        case 'filter': {
          if (!condition || !condition.field || condition.value === undefined) {
            return { success: false, error: 'Filter requires condition with field and value' };
          }

          const filtered = data.filter(row => {
            const val = row[condition.field];
            switch (condition.operator || 'equals') {
              case 'equals': return val == condition.value;
              case 'gt': return val > condition.value;
              case 'lt': return val < condition.value;
              case 'contains': return String(val).toLowerCase().includes(String(condition.value).toLowerCase());
              default: return val == condition.value;
            }
          });

          return { success: true, operation: 'filter', matchCount: filtered.length, totalRecords: data.length, result: filtered.slice(0, 50) };
        }

        case 'aggregate': {
          if (!field) {
            return { success: false, error: 'Aggregate requires a field parameter' };
          }

          const groups = {};
          for (const row of data) {
            const key = String(row[field] || 'N/A');
            groups[key] = (groups[key] || 0) + 1;
          }

          const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
          return { success: true, operation: 'aggregate', field, groupCount: sorted.length, result: Object.fromEntries(sorted) };
        }

        case 'top_n': {
          if (!field) {
            return { success: false, error: 'top_n requires a field parameter' };
          }

          const sorted = [...data].sort((a, b) => (b[field] || 0) - (a[field] || 0));
          return { success: true, operation: 'top_n', field, limit, result: sorted.slice(0, limit) };
        }

        case 'trend': {
          if (!field) {
            return { success: false, error: 'Trend requires a field parameter' };
          }

          const values = data.map(r => r[field]).filter(v => typeof v === 'number');
          if (values.length < 2) {
            return { success: false, error: 'Need at least 2 numeric values for trend analysis' };
          }

          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const firstHalf = values.slice(0, Math.floor(values.length / 2));
          const secondHalf = values.slice(Math.floor(values.length / 2));
          const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          const trend = avgSecond > avgFirst ? 'increasing' : avgSecond < avgFirst ? 'decreasing' : 'stable';
          const changePercent = avgFirst !== 0 ? +(((avgSecond - avgFirst) / avgFirst) * 100).toFixed(2) : 0;

          return {
            success: true,
            operation: 'trend',
            field,
            result: { trend, changePercent, overall_avg: +avg.toFixed(2), first_half_avg: +avgFirst.toFixed(2), second_half_avg: +avgSecond.toFixed(2), dataPoints: values.length }
          };
        }

        default:
          return { success: false, error: `Unknown operation: ${operation}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
