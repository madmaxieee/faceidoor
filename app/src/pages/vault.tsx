import { useEffect } from "react";

import type { NextPage } from "next";
import { useRouter } from "next/router";

import { api } from "@/utils/api";

const Vault: NextPage = () => {
  const { data: checkCookieData, status: checkCookieStatus } =
    api.auth.checkCookie.useQuery();
  const { data: vaultData, status: vaultStatus } = api.vault.image.useQuery();

  const router = useRouter();

  useEffect(() => {
    if (
      (checkCookieStatus === "success" && !checkCookieData?.success) ||
      checkCookieStatus === "error"
    ) {
      router.push("/");
    }
  }, [checkCookieData?.success, checkCookieStatus, router]);

  if (checkCookieStatus === "loading") return <div>loading</div>;

  if (checkCookieStatus === "error") return <div>error</div>;

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {vaultStatus === "success" && <img src={vaultData?.image} alt="vault" />}
    </div>
  );
};

export default Vault;
