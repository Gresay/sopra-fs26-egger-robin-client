// Display a single user profile after having clicked on it in the users overview
// each user has their own slug /[id] (/1, /2, /3, ...) and is displayed using this file
// Displays: username, online status, creation date, and bio

"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Spin, Modal, Form, Input } from "antd";

const Profile: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const apiService = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    value: storedUserId,
    clear: clearToken,
  } = useLocalStorage<string>("userId", "");

  const {
    clear: clearUserId,
  } = useLocalStorage<string>("token", "");

  // Helper function to handle 401 errors
  const handleUnauthorized = async (): Promise<void> => {
    try {
      // Try to logout to set user status to OFFLINE
      if (storedUserId) {
        await apiService.post(`/users/${storedUserId}/logout`, {});
      }
    } catch (error) {
      console.error("Error during unauthorized logout:", error);
    } finally {
      // Clear token and user ID
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

  // Handle password change submission
  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    try {
      setPasswordLoading(true);
      const userId = params.id as string;

      // Call API to change password
      await apiService.post(`/users/${userId}`, {
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      // Show success message
      alert("Password changed successfully! You will be logged out.");

      // Close modal and logout
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
      await handleUnauthorized();
    } catch (error) {
      // If it's a 401 error, properly logout and redirect to login
      if (error instanceof Error && error.message.includes("401")) {
        await handleUnauthorized();
        return;
      }
      if (error instanceof Error) {
        alert(`Something went wrong while changing password:\n${error.message}`);
      } else {
        console.error("An unknown error occurred while changing password.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userId = params.id as string;
        const fetchedUser: User = await apiService.get<User>(`/users/${userId}`);
        setUser(fetchedUser);
      } catch (error) {
        // If it's a 401 error, properly logout and redirect to login
        if (error instanceof Error && error.message.includes("401")) {
          await handleUnauthorized();
          return;
        }
        if (error instanceof Error) {
          alert(`Something went wrong while fetching the user:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [apiService, params.id]);

  // Format creation date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="card-container">
      {loading ? (
        <Spin size="large" />
      ) : user ? (
        <Card title={`${user.username}'s Profile`} className="profile-card">
          <div style={{ marginBottom: "16px" }}>
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color: user.status === "ONLINE" ? "green" : "red",
                }}
              >
                {user.status}
              </span>
            </p>
            <p>
              <strong>Creation Date:</strong> {formatDate(user.creationDate)}
            </p>
            <p>
              <strong>Bio:</strong> {user.bio || "No bio provided"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={() => router.push("/users")} type="primary">
              Back to Users
            </Button>
            {storedUserId && String(storedUserId) === String(user.id) && (
              <Button
                onClick={() => setIsPasswordModalOpen(true)}
                type="default"
              >
                Edit Password
              </Button>
            )}
          </div>

          <Modal
            title="Change Password"
            open={isPasswordModalOpen}
            onCancel={() => {
              setIsPasswordModalOpen(false);
              passwordForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  { required: true, message: "Please enter your current password!" },
                ]}
              >
                <Input type="password" placeholder="Enter current password" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: "Please enter a new password!" },
                  {
                    min: 1,
                    message: "Password must be at least 1 character long!",
                  },
                ]}
              >
                <Input type="password" placeholder="Enter new password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                rules={[
                  { required: true, message: "Please confirm your new password!" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The passwords do not match!")
                      );
                    },
                  }),
                ]}
              >
                <Input
                  type="password"
                  placeholder="Confirm new password"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  block
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      ) : (
        <p>User not found</p>
      )}
    </div>
  );
};

export default Profile;
