import React, { useState } from 'react'
import Navbar from '../../components/Navbar/Navbar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import PasswordInput from '../../components/Input/PasswordInput.jsx'
import { validateEmail } from '../../utils/helper.js'
import { authAPI } from '../../services/api.js'
import Toast from '../../components/Toast/Toast.jsx'

const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (!password) {
            setError("Password is required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await authAPI.login({ email, password });

            if (response.data.error === false) {
                // Store token and user info
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                setToast({
                    isOpen: true,
                    message: 'Login successful! Redirecting...',
                    type: 'success'
                });

                // Redirect to dashboard
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
            setToast({
                isOpen: true,
                message: errorMessage,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />

            <div className="flex items-center justify-center mt-28">
                <div className="w-96 border rounded bg-white px-7 py-10">
                    <form onSubmit={handleLogin}>

                        <h4 className="text-2xl mb-7">Login</h4>

                        <input
                            type="text"
                            placeholder="Email"
                            className="input-box"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <PasswordInput
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && <p className="text-red-500 text-xs pb-1">{error}</p>}

                        <button
                            type="submit"
                            className="btn-primary flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                'Login'
                            )}
                        </button>

                        <p className="text-sm text-center mt-4">Not registered yet?{" "}
                            <Link to="/signup" className="font-medium text-primary underline">
                                Create an Account
                            </Link>
                        </p>
                    </form>
                </div>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </>
    )
}

export default Login