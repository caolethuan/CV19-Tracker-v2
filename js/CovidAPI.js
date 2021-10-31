const covidApi = {
    getSummary: async () => {
        return await fetchRequest(covidApiEndPoints.summary())
    }
}

const covid_api_base = 'https://corona-virus-world-and-india-data.p.rapidapi.com/api'

const covidApiEndPoints = {
    summary: () => {
        return getApiPath('')
    }
}

getApiPath = (end_point) => {
    return covid_api_base
}