import axios from 'axios';

const DEFAULT_HOST = "https://crowdbotics-slack-dev.crowdbotics.com";
const CURRENT_PATH = "v1/prd/12117/phase";

class ApiClient {
  
  get(options: any) {
  return this._request({ ...options, method: "GET" });
  }

  post(options: any) {
  return this._request({ ...options, method: "POST" });
  }

  // put(options: any) {
  // return this._request({ ...options, method: "PUT" });
  // }

  // patch(options: any) {
  // return this._request({ ...options, method: "PATCH" });
  // }


  async _request(options: any) {
    const { params, method, body, endpoint } = options;
    const host = DEFAULT_HOST;
    const path = CURRENT_PATH;
    const headers =  {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Token cc049610cb2694a2c67ba388b15c115401542dc6`,
    }
    let url = `${host}/api/${endpoint}/`;

    if (params) {
      url += "?" + new URLSearchParams(params).toString();
    }

    if (method === "GET") {
    try {
      const response = await axios.get(url, {
        headers: headers,
      });
      return response;
    } catch (error) {
      // Handle error
      console.error(error);
      throw error;
    }
  } else if (method === "POST") {
    try {
      const response = await axios.post(url, body, {
        headers: headers,
      });
      return response;
    } catch (error) {
      // Handle error
      console.error(error);
      throw error;
    }
    }
  }

}

export const apiClient = new ApiClient();



// import axios from 'axios';

// const DEFAULT_HOST = "https://app.crowdbotics.com";
// const CURRENT_PATH = "v1/prd/12117/phase";

// class ApiClient {

// get(options: any) {
//     return this._request({ ...options, method: "GET" });
//     }

//     post(options: any) {
//     return this._request({ ...options, method: "POST" });
//     }

//     put(options: any) {
//     return this._request({ ...options, method: "PUT" });
//     }

//     patch(options: any) {
//     return this._request({ ...options, method: "PATCH" });
//     }

//   async _request({
//     body,
//     method,
//     params,
//   }: {body: any; method: string; params?: any}) {
//     const host = DEFAULT_HOST;
//     const path = CURRENT_PATH;
//     let url = `${host}/api/${path}/`;

    
//     if (params) {
//       url += "?" + new URLSearchParams(params).toString();
//     }

//     try {
//       const response = await axios({
//         url: url,
//         method: method,
//         data: body,
//         headers: {
//           accept: "application/json",
//           "content-type": "application/json",
//           authorization: `Token cc049610cb2694a2c67ba388b15c115401542dc6`,
//         },
//       });
//       return response;
//     } catch (error) {
//       // Handle error
//       console.error(error);
//       throw error;
//     }
//   }
// }

// export const apiClient = new ApiClient();
