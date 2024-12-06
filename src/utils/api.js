import axios from "axios";
export const getNeedingProduct = async ({ desc }) => {
    const {data} = await axios.post('http://127.0.0.1:8000/ai',{desc})
    return data.need
}