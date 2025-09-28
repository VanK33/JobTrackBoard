import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md max-w-lg w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">应用出现错误</h1>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                很抱歉，应用遇到了意外错误。请尝试刷新页面，或者检查以下可能的原因：
              </p>
              <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                <li>网络连接问题</li>
                <li>后端服务器暂时不可用</li>
                <li>浏览器兼容性问题</li>
              </ul>
            </div>

            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  技术详情 (点击展开)
                </summary>
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                刷新页面
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary