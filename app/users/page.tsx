// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Table, Spin } from "antd";
import type { TableProps } from "antd"; // antd component library allows imports of types
// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";

// Helper function to format creation date
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

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <span style={{ color: status === "ONLINE" ? "green" : "red" }}>
        {status}
      </span>
    ),
  },
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    value: userId,
    clear: clearToken, // all we need in this scenario is a method to clear the token
  } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");
  
  const {
    value: storedUserId,
    clear: clearUserId,
  } = useLocalStorage<string>("userId", "");

  const handleLogout = async (): Promise<void> => {
    try {
      // Call the server logout endpoint to set status to OFFLINE
      if (storedUserId) {
        await apiService.post(`/users/${storedUserId}/logout`, {});
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear token and user ID
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        console.log("Fetched users:", users);
      } catch (error) {
        // If it's a 401 error, properly logout and redirect to login
        if (error instanceof Error && error.message.includes("401")) {
          await handleUnauthorized();
          return;
        }
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService]); // dependency apiService does not re-trigger the useEffect on every render because the hook uses memoization (check useApi.tsx in the hooks).
  // if the dependency array is left empty, the useEffect will trigger exactly once
  // if the dependency array is left away, the useEffect will run on every state change. Since we do a state change to users in the useEffect, this results in an infinite loop.
  // read more here: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies

  return (
    <div className="card-container">
      <Card
        title="All registered users"
        loading={!users}
        className="dashboard-container"
      >
        {users && (
          <>
            {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
            <Table<User>
              columns={columns}
              dataSource={users}
              rowKey="id"
              onRow={(row) => ({
                onClick: () => router.push(`/users/${row.id}`),
                style: { cursor: "pointer" },
              })}
            />
            <Button onClick={handleLogout} type="primary" style={{ marginTop: "16px" }}>
              Logout
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
