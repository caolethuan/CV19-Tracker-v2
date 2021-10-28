const COLORS = {
    confirmed: '#ff0000',
    recovered: '#008000',
    deaths: '#373c43',
}

const CASE_STATUS = {
    confirmed: 'confirmed',
    recovered: 'recovered',
    deaths: 'deadths',
}

let body = document.querySelector('body')

let countries_list

let all_time_chart, days_chart, recover_rate_chart

let summaryData

window.onload = async () => {
    console.log('ready . . .')
    // Only init chart on page loaded fisrt time
    initTheme()

    initCountryFilter()

    await initAllTimesChart()

    await initDaysChart()

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
    
    // await loadAllTimeChart(country)
    
    // await loadDaysChart(country)
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

    let summary_countries = summaryData["countries_stat"]

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

}

initAllTimesChart = async () => {
    let options = {
        chart: {
            type: 'bar'
        },
        colors: [COLORS.confirmed, COLORS.recovered, COLORS.deaths],
        series: [],
        xaxis: {
            categories: [],
            labels: {
                show: false
            }
        },
        grid: {
            show: false
        },
        stroke: {
            curve: 'smooth'
        }
    }

    all_time_chart = new ApexCharts(document.querySelector('#all-time-chart'), options)

    all_time_chart.render()
}

renderData = (country_data) => {
    let res = []
    country_data.forEach(e => {
        res.push(e.Cases)
    })
    return res
}

renderWorldData = (world_data, status) => {
    let res = []
    world_data.forEach(e => {
        switch (status) {
            case CASE_STATUS.confirmed:
                res.push(e.TotalConfirmed)
                break
            case CASE_STATUS.TotalRecovered:
                res.push(e.TotalRecovered)
                break
            case CASE_STATUS.deaths:
                res.push(e.TotalDeaths)
                break
        }
    })
    return res
}

loadAllTimeChart = async (country) => {
    let labels = []

    let confirm_data, recovered_data, deaths_data

    if (isGlobal(country)) {
        let world_data = await covidApi.getWorldAllTimeCases()
        console.log(world_data)
        world_data.sort((a, b) => new Date(a.Date) - new Date(b.Date))

        world_data.forEach(e => {
            let d = new Date(e.Date)
            labels.push(`${d.getFullYear()} - ${d.getMonth() + 1} - ${d.getDate()}`)
        })
        confirm_data = renderWorldData(world_data, CASE_STATUS.confirmed)
        recovered_data = renderWorldData(world_data, CASE_STATUS.recovered)
        deaths_data = renderWorldData(world_data, CASE_STATUS.deaths)
    } else {
        let confirmed = await covidApi.getCountryAllTimeCases(country, CASE_STATUS.confirmed)
        let recovered = await covidApi.getCountryAllTimeCases(country, CASE_STATUS.recovered)
        let deaths = await covidApi.getCountryAllTimeCases(country, CASE_STATUS.deaths)

        confirm_data = renderData(confirmed)
        recovered_data = renderData(recovered)
        deaths_data = renderData(deaths)

        confirmed.forEach(e => {
            let d = new Date(e.Date)
            labels.push(`${d.getFullYear()} - ${d.getMonth() + 1} - ${d.getDate()}`)
        })
    }

    let series = [{
        name: 'Confirmed',
        data: confirm_data
    }, {
        name: 'Recovered',
        data: recovered_data
    }, {
        name: 'Deaths',
        data: deaths_data
    }]

    all_time_chart.updateOptions({
        series: series,
        xaxis: {
            categories: labels
        }
    })
}

initDaysChart = async () => {
    let options = {
        chart: {
            type: 'line'
        },
        colors: [COLORS.confirmed, COLORS.recovered, COLORS.deaths],
        series: [],
        xaxis: {
            categories: [],
            labels: {
                show: false
            }
        },
        grid: {
            show: false
        },
        stroke: {
            curve: 'smooth'
        }
    }

    days_chart = new ApexCharts(document.querySelector('#days-chart'), options)

    days_chart.render()
}

// loadDaysChart = async (country) => {
//     let labels = []

//     let confirm_data, recovered_data, deaths_data

//     if (isGlobal(country)) {
//         let world_data = await covidApi.getWorldDaysCases()

//         world_data.sort((a, b) => new Date(a.Date) - new Date(b.Date))

//         world_data.forEach(e => {
//             let d = new Date(e.Date)
//             labels.push(`${d.getFullYear()} - ${d.getMonth() + 1} - ${d.getDate()}`)
//         })

//         confirm_data = renderWorldData(world_data, CASE_STATUS.confirmed)
//         recovered_data = renderWorldData(world_data, CASE_STATUS.recovered)
//         deaths_data = renderWorldData(world_data, CASE_STATUS.deaths)
//     } else {
//         let confirmed = await covidApi.getCountryDaysCases(country, CASE_STATUS.confirmed)
//         let recovered = await covidApi.getCountryDaysCases(country, CASE_STATUS.recovered)
//         let deaths = await covidApi.getCountryDaysCases(country, CASE_STATUS.deaths)

//         confirm_data = renderData(confirmed)
//         recovered_data = renderData(recovered)
//         deaths_data = renderData(deaths)

//         confirmed.forEach(e => {
//             let d = new Date(e.Date)
//             labels.push(`${d.getFullYear()} - ${d.getMonth() + 1} - ${d.getDate()}`)
//         })
//     }

//     let series = [{
//         name: 'Confirmed',
//         data: confirm_data
//     }, {
//         name: 'Recovered',
//         data: recovered_data
//     }, {
//         name: 'Deaths',
//         data: deaths_data
//     }]

//     days_chart.updateOptions({
//         series: series,
//         xaxis: {
//             categories: labels
//         }
//     })
// }

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
    
    // let summaryData = await covidApi.getSummary()  
    
    // countries_list = summaryData["countries_stat"].map(e => e.country_name)

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