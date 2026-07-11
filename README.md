# onetimesuite.com

Front door for the One-Time Suite. This repo has no content of its own — it's
a thin nginx reverse proxy onto `advancedmarketing.co/software/`, so visitors
land on and stay on `onetimesuite.com` while the actual pages/build system
(product landing pages, comparisons, the bundle page) continue to live in
`advancedmarketing-main`.

This is a bootstrap step. The plan is for `onetimesuite.com` to become the
real master purchase hub — native Whop checkout plus a purchaser dashboard
where bought apps show up and are directly accessible — at which point this
proxy gets replaced with real content served natively from here.

See `nginx.conf` for the routing rules.
