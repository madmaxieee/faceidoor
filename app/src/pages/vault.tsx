import { useEffect } from "react";
import Confetti from "react-confetti";

import type { NextPage } from "next";
import { useRouter } from "next/router";

import clsx from "clsx";

import { useWindowSize } from "@/hooks";
import { api } from "@/utils/api";

const Vault: NextPage = () => {
  const { data: vaultData, status: vaultStatus } = api.vault.image.useQuery();
  const { width, height } = useWindowSize();
  const {
    mutate: logout,
    status: logoutStatus,
    data: logoutData,
  } = api.auth.logout.useMutation();

  const router = useRouter();

  useEffect(() => {
    if (logoutStatus === "success" && logoutData?.success) {
      router.push("/");
    }
  }, [logoutData?.success, logoutStatus, router]);

  useEffect(() => {
    if (vaultStatus === "error") {
      router.push("/");
    }
  }, [vaultStatus, router]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-gray-700 p-24">
      {vaultStatus === "loading" && (
        <h1 className="mb-16 text-center text-5xl leading-normal text-white">
          Loading...
        </h1>
      )}
      {vaultStatus === "error" && (
        <h1 className="mb-16 text-center text-5xl leading-normal text-white">
          You have not unlocked the vault yet!
        </h1>
      )}
      {vaultStatus === "success" && (
        <>
          <h1 className="mb-16 text-center text-5xl leading-normal text-white">
            Congratulations! You unlocked the vault! <br />
            Here's your cute animal:
          </h1>
          {vaultStatus === "success" && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={vaultData?.image}
              className="h-[500px] rounded-3xl"
              alt="vault"
            />
          )}
          <button
            className={clsx(
              "mt-12 w-36 rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            onClick={() => logout()}
            disabled={logoutStatus === "loading"}
          >
            logout
          </button>
          <Confetti width={width} height={height} />
        </>
      )}
    </main>
  );
};

export default Vault;
