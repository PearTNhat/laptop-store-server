import axios from "axios";
export const getNeedingProduct = async ({ desc }) => {
    const config ={
        timeout: 50000
    }
    const {data} = await axios.post('http://127.0.0.1:8000/ai',{desc},config)
    return data.need
}