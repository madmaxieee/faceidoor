import { useEffect, useRef, useState } from "react";

import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import clsx from "clsx";

import Spinner from "@/components/Spinner";
import { useInterval } from "@/hooks";
import Stack from "@/utils/Stack";
import { api } from "@/utils/api";

const Home: NextPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stackRef = useRef(new Stack<string>(5));
  const [stage, setStage] = useState<"camera" | "signin" | "signup">("camera");
  const [username, setUsername] = useState("");
  const router = useRouter();
  const { data: checkCookieData, status: checkCookieStatus } =
    api.auth.checkCookie.useQuery();
  const {
    data: loginData,
    status: loginStatus,
    mutate: login,
  } = api.auth.login.useMutation();
  const {
    data: signupData,
    status: signupStatus,
    mutate: signup,
  } = api.auth.signup.useMutation();
  // const { mutate: sendImage } = api.auth.images.useMutation();
  const isLoggedIn = loginStatus === "success" && loginData?.success;

  useEffect(() => {
    if (
      isLoggedIn ||
      (checkCookieStatus === "success" && checkCookieData?.success)
    ) {
      router.push("/vault");
    }
  }, [checkCookieData?.success, checkCookieStatus, isLoggedIn, router]);

  // capture a frame from the video stream
  const captureFrame = () => {
    const video = document.querySelector("#face") as HTMLVideoElement;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURI = canvas.toDataURL("image/jpeg");
      return dataURI;
    }
  };

  // send the frame to the server
  const handleSignIn = () => {
    const dataURI = captureFrame();
    if (dataURI) {
      stackRef.current.push(dataURI);
    }
    const images = stackRef.current.dumpAll();
    login({ images, username });
  };

  const handleSignUp = () => {
    const dataURI = captureFrame();
    if (dataURI) {
      stackRef.current.push(dataURI);
    }
    const images = stackRef.current.dumpAll();
    signup({ images, username });
  };

  const getCamera = () => {
    if (navigator.mediaDevices.getUserMedia === undefined) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then((stream) => {
        if (videoRef.current === null) {
          return;
        }
        videoRef.current.srcObject = stream;
        setStage("signin");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useInterval(() => {
    if (videoRef.current === null) {
      return;
    }
    const dataURI = captureFrame();
    if (dataURI) {
      stackRef.current.push(dataURI);
    }
  }, 1000);

  return (
    <>
      <Head>
        <title>Face id Vault</title>
        <meta name="description" content="MFA demo app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className={clsx(
          "flex h-screen w-full flex-col items-center justify-center p-24 transition-colors",
          stage === "signup" ? "bg-cyan-800" : "bg-gray-700"
        )}
      >
        <div className="mx-auto my-16 flex flex-col items-center justify-center px-6">
          <p className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white">
            Face id Vault
          </p>
          <div className="w-screen max-w-xl rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
              {stage === "camera" && (
                <>
                  <h1 className="mb-12 text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
                    You must enable your camera to continue
                  </h1>
                  <button
                    className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={getCamera}
                  >
                    Enable camera
                  </button>
                </>
              )}
              {stage === "signin" && (
                <>
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
                    Unlock your vault
                  </h1>
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Your account
                    </label>
                    <input
                      name="username"
                      className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5  text-white placeholder-gray-400 focus:border-blue-500 sm:text-sm"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <button
                    className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    onClick={handleSignIn}
                  >
                    Sign in
                  </button>
                  <p className="text-sm font-light text-gray-400">
                    Don't have an account yet? &nbsp;
                    <span className="font-medium text-blue-500">
                      <button
                        className="hover:underline"
                        onClick={() => setStage("signup")}
                      >
                        Sign up
                      </button>
                    </span>
                  </p>
                </>
              )}
              {stage === "signup" && (
                <>
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
                    Create your vault
                  </h1>
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Your account
                    </label>
                    <input
                      name="username"
                      className="block w-full rounded-lg border border-gray-600 bg-gray-700 p-2.5  text-white placeholder-gray-400 focus:border-blue-500 sm:text-sm"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <button
                    className="w-full rounded-lg bg-cyan-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-300"
                    onClick={handleSignUp}
                  >
                    Sign up
                  </button>
                  <p className="text-sm font-light text-gray-400">
                    Already have an account? &nbsp;
                    <span className="font-medium text-blue-500">
                      <button
                        className="hover:underline"
                        onClick={() => setStage("signin")}
                      >
                        Sign in
                      </button>
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div
          className={clsx(
            "flex w-96 flex-col items-center justify-center gap-4",
            stage !== "camera" ? "" : "hidden"
          )}
        >
          <div className="relative">
            <video
              id="face"
              ref={videoRef}
              width="720"
              autoPlay
              className="rounded-2xl"
            />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-blue-500 opacity-50" />
            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-blue-200 opacity-50" />
          </div>
          <p className="text-lg text-gray-400">
            Scanning your face, please wait
          </p>
          <Spinner />
          <canvas id="canvas" hidden />
        </div>
      </main>
    </>
  );
};

export default Home;
