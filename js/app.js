const COLORS = {
    confirmed: '#ff0000',
    recovered: '#008000',
    deaths: '#373c43',
    
    serious_critical: '#D830EB',
    new_cases: '#FF6178',
    total_cases_per_1m: '#FEBC3B'
}

const CASE_STATUS = {
    confirmed: 'confirmed',
    recovered: 'recovered',
    deaths: 'deadths',
    serious_critical: 'serious_critical',
    new_cases: 'new_cases',
    total_cases_per_1m: 'total_cases_per_1m_population'
}

let body = document.querySelector('body')

let countries_list

let all_time_chart, days_chart, recover_rate_chart

let summaryData

let summary_countries

window.onload = async () => {
    console.log('ready . . .')
    // Only init chart on page loaded fisrt time
    initTheme()

    initCountryFilter()

    await initAllTimesChart()

    await initRecoveryRate()

    await loadData('World')

    await loadCountrySelectList()

    document.querySelector('#country-select-toggle').onclick = () => {
        document.querySelector('#country-select-list').classList.toggle('active')
    }
}

loadData = async (country) => {
    startLoading()
    
    await loadSummary(country)
    
    await loadAllTimeChart(country)
    
    endLoading()

}

startLoading = () => {
    body.classList.add('loading')
}

endLoading = () => {
    body.classList.remove('loading')
}

isGlobal = (country) => {
    return country === 'World'
}

numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

numberWithCommas2 = (x) => {
    return x.replace(/,/g, '')
}

showConfirmedTotal = (total) => {
    document.querySelector('#confirmed-total').textContent = numberWithCommas(total)
}

showRecoveredTotal = (total) => {
    document.querySelector('#recovered-total').textContent = numberWithCommas(total)
}

showDeathsTotal = (total) => {
    document.querySelector('#death-total').textContent = numberWithCommas(total)
}

showRanking = (rank) => {
    document.querySelector('.country-ranking span').textContent = rank.toString()
}

showDate = () => {
    let d = new Date;
    document.querySelector('.date-updated span').textContent = d.toLocaleDateString()
}

loadSummary = async (country) => {

    //country = slug

    summaryData = await covidApi.getSummary()
    let summary = summaryData["world_total"]

    //list name of country
    countries_list = summaryData["countries_stat"].map(e => e.country_name)
    //sort list name
    countries_list.sort((a,b) => {
        if(a < b) { return -1; }
        if(a > b) { return 1; }
        return 0
    })
    //add world select
    countries_list.unshift('World')

    summary_countries = summaryData["countries_stat"]

    if (!isGlobal(country)) {
        let summary_country = summary_countries.find(function(e) {
           return e["country_name"] === country
        })
        console.log(summary_country)

        showConfirmedTotal(summary_country["cases"])
        showRecoveredTotal(summary_country["total_recovered"])
        showDeathsTotal(summary_country["deaths"])

        //Load recover rate country
        await loadRecoveryRate(Math.round(Number.parseInt(numberWithCommas2(summary_country["total_recovered"])) / Number.parseInt(numberWithCommas2(summary_country["cases"])) * 100))
        console.log(Number.parseInt(numberWithCommas2(summary_country["total_recovered"])) / Number.parseInt(numberWithCommas2(summary_country["cases"])) * 100)
    }
    else {
        showConfirmedTotal(summary["total_cases"])
        showRecoveredTotal(summary["total_recovered"])
        showDeathsTotal(summary["total_deaths"])

        //Load recover rate world
        await loadRecoveryRate(Math.round(Number.parseInt(numberWithCommas2(summary["total_recovered"])) / Number.parseInt(numberWithCommas2(summary["total_cases"])) * 100))

    }


    //Load countries table

    let casesByCountries = summary_countries.sort((a, b) => b['cases'] - a['cases'])

    let table_countries_body = document.querySelector('#table-contries tbody')
    table_countries_body.innerHTML = ''


    for (let i = 0; i < 10; i++) {
        let row = `
            <tr>
                <td>${casesByCountries[i].country_name}</td>
                <td>${(casesByCountries[i].cases)}</td>
                <td>${(casesByCountries[i].total_recovered)}</td>
                <td>${(casesByCountries[i].deaths)}</td>
            </tr>
        `
        table_countries_body.innerHTML += row
    }

    //show ranking
    let rankIndex
    let rank = casesByCountries.find((e, index) => {
        rankIndex=index
        return e.country_name == country
    })
    if (country =='World') showRanking(0)
    else showRanking(rankIndex+1)
    //show date
    showDate()
}

initAllTimesChart = async () => {
    let options = {
        chart: {
            height: '350',
            type: 'bar'
        },
        colors: [COLORS.serious_critical, COLORS.total_cases_per_1m, COLORS.new_cases],
        plotOptions: {
            bar: {
                columnWidth: '45%',
                distributed: true,
                dataLabels: {
                    position: 'top'
                  }
            }
        },
        dataLabels: {
            enabled:true,
            dropShadow: {
                enabled: true,
                opacity: 1
            }
        },
        legend: {
            show: false
        },
        series: [],
        xaxis: {
            categories: [],
            labels: {
                style: {
                    colors: [COLORS.serious_critical, COLORS.total_cases_per_1m, COLORS.new_cases],
                    fontSize: '14px'
                }
            }
        }
    }

    all_time_chart = new ApexCharts(document.querySelector('#all-time-chart'), options)

    all_time_chart.render()
}

renderWorldData = (world_data, status) => {
    let res = []
    switch (status) {
        case CASE_STATUS.serious_critical:
            res.push(Number.parseInt(numberWithCommas2(world_data.serious_critical)))
            break
        case CASE_STATUS.total_cases_per_1m:
            res.push(Number.parseInt(numberWithCommas2(world_data.total_cases_per_1m_population)))
            break
        case CASE_STATUS.new_cases:
            res.push(Number.parseInt(numberWithCommas2(world_data.new_cases)))
    }
    return res
}

loadAllTimeChart = async (country) => {
    let labels = []

    let confirm_data, recovered_data, deaths_data,
        activeCases_data, seriousCases_data, newCases_data, newDeathCases_data,totalCasesPer1m_data
    let world_data = summaryData.world_total
    let country_data
    if (isGlobal(country)) {
        
        console.log(world_data)
        
        seriousCases_data = renderWorldData(world_data, CASE_STATUS.serious_critical)
        totalCasesPer1m_data = renderWorldData(world_data, CASE_STATUS.total_cases_per_1m)
        newCases_data = renderWorldData(world_data, CASE_STATUS.new_cases)

    } else {
        country_data = summary_countries.find(function(e){
                return e.country_name===country
        })


        seriousCases_data = renderWorldData(country_data, CASE_STATUS.serious_critical)
        totalCasesPer1m_data = renderWorldData(country_data, CASE_STATUS.total_cases_per_1m)
        newCases_data = renderWorldData(country_data, CASE_STATUS.new_cases)

    }

    let series = [{
        name: 'Cases',
        data: [{
            x: 'Serious Cases', 
            y: seriousCases_data
        }, {
            x: 'Total cases per 1m population',
            y: totalCasesPer1m_data
        }, {
            x: 'New Cases',
            y: newCases_data}]}]

    all_time_chart.updateOptions({
        series: series,
        xaxis: {
            categories: ['Serious Cases', 'Total cases per 1m population', 'New Cases']
        }
    })
}

initRecoveryRate = async () => {
    let options = {
        chart: {
            type: 'radialBar',
            height: '350'
        },
        series: [],
        labels: ['Recovery rate'],
        colors: [COLORS.recovered]

    }

    recover_rate_chart = new ApexCharts(document.querySelector('#recover-rate-chart'), options)

    recover_rate_chart.render()
}

loadRecoveryRate = async (rate) => {
    // Use updateSeries
    recover_rate_chart.updateSeries([rate])
}

// darkmode switch

initTheme = () => {
    let dark_mode_switch = document.querySelector('#darkmode-switch')

    dark_mode_switch.onclick = () => {
        dark_mode_switch.classList.toggle('dark')
        body.classList.toggle('dark')

        setDarkChart(body.classList.contains('dark'))
    }
}

setDarkChart = (dark) => {
    let theme = {
        theme: {
            mode: dark ? 'dark' : 'light'
        }
    }
    all_time_chart.updateOptions(theme)
    days_chart.updateOptions(theme)
    recover_rate_chart.updateOptions(theme)
}

// country select
renderCountrySelectList = (list) => {
    let country_select_list = document.querySelector('#country-select-list')
    country_select_list.querySelectorAll('div').forEach(e => e.remove())
    
    list.forEach(e => {
        let item = document.createElement('div')
        item.classList.add('country-item')
        item.textContent = e.toString()

        item.onclick = async () => {
            document.querySelector('#country-select span').textContent = e.toString()
            country_select_list.classList.toggle('active')
            await loadData(e.toString())
        }
        
        country_select_list.appendChild(item)
    })
}

loadCountrySelectList = async () => {
    let country_select_list = document.querySelector('#country-select-list')

    let item = document.createElement('div')
    item.classList.add('country-item')
    item.textContent = 'World'
    item.onclick = async () => {
        document.querySelector('#country-select span').textContent = 'World'
        country_select_list.classList.toggle('active')
        await loadData('World')
    }
    country_select_list.appendChild(item)

    renderCountrySelectList(countries_list)
}

// Country filter
initCountryFilter = () => {
    let input = document.querySelector('#country-select-list input')
    input.onkeyup = () => {
        let filtered = countries_list.filter(e => e.toLowerCase().includes(input.value.toLowerCase()))
        renderCountrySelectList(filtered)
    }
}