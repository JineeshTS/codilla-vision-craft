import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "passed" | "failed";
  duration?: number;
  error?: string;
}

export const TestRunner = () => {
  const [tests, setTests] = useState<TestCase[]>([
    {
      id: "auth-login",
      name: "User Authentication - Login",
      description: "Test user can login with valid credentials",
      status: "pending",
    },
    {
      id: "auth-signup",
      name: "User Authentication - Signup",
      description: "Test new user registration flow",
      status: "pending",
    },
    {
      id: "code-generation",
      name: "Code Generation",
      description: "Test AI code generation with valid prompt",
      status: "pending",
    },
    {
      id: "github-commit",
      name: "GitHub Commit",
      description: "Test code commit to GitHub repository",
      status: "pending",
    },
    {
      id: "template-load",
      name: "Template Loading",
      description: "Test UI template loading and rendering",
      status: "pending",
    },
  ]);

  const [running, setRunning] = useState(false);

  const runAllTests = async () => {
    setRunning(true);
    toast.info("Running tests...");

    for (const test of tests) {
      await runSingleTest(test.id);
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRunning(false);
    const passedCount = tests.filter(t => t.status === "passed").length;
    toast.success(`Tests completed: ${passedCount}/${tests.length} passed`);
  };

  const runSingleTest = async (testId: string) => {
    setTests(prev => prev.map(t => 
      t.id === testId ? { ...t, status: "running" } : t
    ));

    // Simulate test execution
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    const duration = Date.now() - startTime;

    // Randomly pass/fail for demo (80% pass rate)
    const passed = Math.random() > 0.2;

    setTests(prev => prev.map(t => 
      t.id === testId 
        ? { 
            ...t, 
            status: passed ? "passed" : "failed",
            duration,
            error: passed ? undefined : "Test assertion failed: Expected value to be truthy"
          }
        : t
    ));
  };

  const getStatusIcon = (status: TestCase["status"]) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const passedCount = tests.filter(t => t.status === "passed").length;
  const failedCount = tests.filter(t => t.status === "failed").length;
  const totalTests = tests.length;

  return (
    <Card className="glass-panel p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Test Suite</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{totalTests} tests</Badge>
              {passedCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {passedCount} passed
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="destructive">{failedCount} failed</Badge>
              )}
            </div>
          </div>
          <Button
            onClick={runAllTests}
            disabled={running}
            className="gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {running ? "Running..." : "Run All Tests"}
          </Button>
        </div>

        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(test.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{test.name}</p>
                    {test.duration && (
                      <span className="text-xs text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {test.description}
                  </p>
                  {test.error && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                      {test.error}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => runSingleTest(test.id)}
                  disabled={running}
                >
                  Run
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};