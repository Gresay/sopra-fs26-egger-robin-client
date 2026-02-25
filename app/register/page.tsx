"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import FormItem from "antd/es/form/FormItem";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface FormFieldProps {
  Name: string;
  Username: string;
  Bio: string;
  Password: string;
  Confirm_Password: string;
}

interface RegisterResponse {
  token: string;
  user: User;
}

const Register: React.FC = () => {
  const router = useRouter(); 
  const apiService = useApi();
  const [form] = Form.useForm();

  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we do not need the token value
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    // clear: clearToken, // is commented out because we do not need to clear the token when logging in
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");
  

  const handleRegister = async (values: FormFieldProps) => {
    try{
    const response = await apiService.post<RegisterResponse>("/auth/Register", values);

    setToken(response.token);
    apiService.setToken(response.token); // set the token in the ApiService instance for authenticated requests
    router.push("/users");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the register:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during register.");
      }
    }
  };

  return(
    <div className ="register-container">
      <div className="register-card">
        <Form
          form={form}
          name="register"
          size="large"
          variant="outlined"
          onFinish= {(values) => {handleRegister(values)}}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input your Name!" }]}
          >
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input your Username!" }]}
          >
            <Input placeholder="Enter a username" />
          </Form.Item>
          <Form.Item
            name="bio"
            label="Bio"
            rules={[{ required: false, message: "Please input a Bio!" }]}
          >
            <Input placeholder="Enter bio" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your Password!" }]}
          >
            <Input placeholder="Enter Password" />
          </Form.Item>
          <Form.Item
            name="Confirm_Password"
            label="Confirm Password"
            rules={[{ required: true, message: "Please confirm your Password!" }]}
          >
            <Input placeholder="Enter the same Password again" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="register-button">
              Register
            </Button>
          </Form.Item>
          <Form.Item>
            <a type="primary" onClick={() => router.push("/login")} className="back-link">
              Back to Login
            </a>
          </Form.Item>
        </Form>
        </div>
    </div>
  )

}

export default Register;