import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, IUpsertUserAddressDto } from '../api/users.api';

export const USER_ADDRESSES_QUERY_KEY = ['user-addresses'] as const;

export function useUserAddresses() {
  return useQuery({
    queryKey: USER_ADDRESSES_QUERY_KEY,
    queryFn: ({ signal }) => usersApi.getAddresses({ signal }),
  });
}

export function useAddressMutations() {
  const queryClient = useQueryClient();
  const invalidateAddresses = () =>
    queryClient.invalidateQueries({ queryKey: USER_ADDRESSES_QUERY_KEY });

  const createAddress = useMutation({
    mutationFn: (data: IUpsertUserAddressDto) => usersApi.createAddress(data),
    onSuccess: invalidateAddresses,
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpsertUserAddressDto }) =>
      usersApi.updateAddress(id, data),
    onSuccess: invalidateAddresses,
  });

  const deleteAddress = useMutation({
    mutationFn: (id: string) => usersApi.deleteAddress(id),
    onSuccess: invalidateAddresses,
  });

  const setDefaultAddress = useMutation({
    mutationFn: (id: string) => usersApi.setDefaultAddress(id),
    onSuccess: invalidateAddresses,
  });

  return {
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
